-- Phase 3 recruitment hardening: server authority must match the UI.
create or replace function public.create_recruitment_offer(p_business_id uuid,p_candidate_id uuid,p_position_id uuid,p_compensation numeric,p_reason text default '') returns uuid language plpgsql security definer set search_path=public as $$
declare a uuid:=(select auth.uid()); pos public.business_open_positions%rowtype; rb public.businesses%rowtype; cp public.founder_progress%rowtype; old_level int:=0; oid uuid; fit numeric;
begin
 if a is null then raise exception 'Authentication required'; end if;
 select * into rb from public.businesses where id=p_business_id for update;
 if not found then raise exception 'Company not found'; end if;
 if not exists(select 1 from public.business_members where business_id=p_business_id and user_id=a and membership_status='active' and role in ('ceo','chro')) then raise exception 'Only the CEO or People Officer can recruit'; end if;
 select * into pos from public.business_open_positions where id=p_position_id and business_id=p_business_id and status='open' for update;
 if not found then raise exception 'Open position not found'; end if;
 select * into cp from public.founder_progress where user_id=p_candidate_id;
 if not found then raise exception 'Candidate profile not found'; end if;
 select greatest(case when p.preferred_role=pos.role then 100 else 0 end,coalesce((cp.skills->>pos.role)::numeric,0)) into fit from public.profiles p where p.user_id=p_candidate_id;
 if fit < pos.minimum_skill or cp.reputation < pos.minimum_reputation or cp.xp < pos.minimum_experience then raise exception 'Candidate does not meet the role criteria'; end if;
 if exists(select 1 from public.profiles where user_id=p_candidate_id and current_business_id=p_business_id) then raise exception 'Candidate is already in this company'; end if;
 select coalesce(b.company_level,0) into old_level from public.profiles p left join public.businesses b on b.id=p.current_business_id where p.user_id=p_candidate_id;
 if old_level>0 and rb.company_level < old_level+2 then raise exception 'Recruiting company must be at least two levels above the candidate company'; end if;
 if old_level=0 and rb.company_level<2 then raise exception 'A company must reach Level 2 before recruiting unattached executives'; end if;
 if exists(select 1 from public.recruitment_offers where business_id=p_business_id and candidate_id=p_candidate_id and status='pending') then raise exception 'A recruitment offer is already pending'; end if;
 insert into public.recruitment_offers(business_id,position_id,candidate_id,recruiter_id,role,compensation,reason) values(p_business_id,p_position_id,p_candidate_id,a,pos.role,p_compensation,trim(p_reason)) returning id into oid;
 insert into public.notifications(user_id,type,title,body,metadata) values(p_candidate_id,'recruitment_offer',rb.name||' wants you as '||upper(pos.role),'A new executive recruitment offer is waiting for you.',jsonb_build_object('offer_id',oid,'business_id',p_business_id,'position_id',p_position_id,'role',pos.role,'compensation',p_compensation));
 return oid;
end; $$;
revoke all on function public.create_recruitment_offer(uuid,uuid,uuid,numeric,text) from public,anon;
grant execute on function public.create_recruitment_offer(uuid,uuid,uuid,numeric,text) to authenticated;

create or replace function public.respond_recruitment_offer(p_offer_id uuid,p_action text) returns uuid language plpgsql security definer set search_path=public as $$
declare a uuid:=(select auth.uid()); o public.recruitment_offers%rowtype; nb public.businesses%rowtype; pos public.business_open_positions%rowtype; old uuid; oldrole text; limit_count integer; participant_count integer;
begin
 if a is null then raise exception 'Authentication required'; end if;
 if p_action not in ('accept','decline') then raise exception 'Invalid recruitment response'; end if;
 select * into o from public.recruitment_offers where id=p_offer_id and candidate_id=a and status='pending' for update;
 if not found then raise exception 'Recruitment offer not found or no longer pending'; end if;
 if p_action='decline' then update public.recruitment_offers set status='declined',responded_at=now() where id=o.id; insert into public.notifications(user_id,type,title,body,metadata) values(o.recruiter_id,'recruitment_response','Recruitment offer declined','The candidate declined your offer.',jsonb_build_object('offer_id',o.id)); return o.business_id; end if;
 select * into nb from public.businesses where id=o.business_id for update;
 select * into pos from public.business_open_positions where id=o.position_id and status='open' for update;
 if not found then raise exception 'The executive position is no longer available'; end if;
 limit_count:=public.business_participant_limit(nb.team_size);
 select count(*) into participant_count from public.business_members where business_id=o.business_id and membership_status='active';
 if limit_count is not null and participant_count>=limit_count then raise exception 'The recruiting company has no available participant capacity'; end if;
 select current_business_id,active_role into old,oldrole from public.profiles where user_id=a for update;
 if old is not null and old<>o.business_id then
   update public.business_members set membership_status='ended',left_at=now() where business_id=old and user_id=a and membership_status='active';
   insert into public.player_career_history(user_id,business_id,company_name,role,started_at,ended_at,summary)
   select a,b.id,b.name,coalesce(oldrole,'member'),coalesce(bm.joined_at,now()),now(),'Moved to a new enterprise through recruitment.' from public.businesses b left join public.business_members bm on bm.business_id=b.id and bm.user_id=a where b.id=old;
 end if;
 insert into public.business_members(business_id,user_id,role,membership_status) values(o.business_id,a,o.role,'active') on conflict(business_id,user_id) do update set role=excluded.role,membership_status='active',left_at=null;
 insert into public.player_career_history(user_id,business_id,company_name,role,summary) values(a,o.business_id,nb.name,o.role,'Joined through recruitment offer.');
 update public.profiles set current_business_id=o.business_id,active_role=o.role,preferred_role=o.role,onboarding_path='executive',onboarding_completed=true,updated_at=now() where user_id=a;
 update public.business_open_positions set status='filled',updated_at=now() where id=o.position_id;
 update public.recruitment_offers set status='accepted',responded_at=now() where id=o.id;
 insert into public.notifications(user_id,type,title,body,metadata) values(o.recruiter_id,'recruitment_response','Recruitment offer accepted','Your executive offer was accepted.',jsonb_build_object('offer_id',o.id,'business_id',o.business_id,'role',o.role));
 return o.business_id;
end; $$;
revoke all on function public.respond_recruitment_offer(uuid,text) from public,anon;
grant execute on function public.respond_recruitment_offer(uuid,text) to authenticated;
