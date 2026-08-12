-- Phase 2 hardening: department ownership + proposal revision/resubmission.
create or replace function public.create_business_proposal(p_business_id uuid,p_department_key text,p_proposal_type text,p_title text,p_description text default '',p_amount numeric default 0,p_expected_impact jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=public
as $$
declare actor uuid:=(select auth.uid()); member_role text; settings_row public.business_org_settings%rowtype; proposal_id uuid; step_counter integer:=1; needs_cfo boolean; needs_ceo boolean; required_role text;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not public.is_business_member(p_business_id) then raise exception 'You are not a member of this company'; end if;
  if length(trim(p_title))<3 or length(trim(p_title))>160 then raise exception 'Proposal title must be between 3 and 160 characters'; end if;
  if p_amount<0 then raise exception 'Proposal amount cannot be negative'; end if;
  if p_department_key not in ('finance','marketing','operations','technology','people') then raise exception 'Invalid department'; end if;
  select role into member_role from public.business_members where business_id=p_business_id and user_id=actor;
  if member_role not in ('ceo','cfo','cmo','coo','cto','chro') then raise exception 'Only executives can create organization proposals'; end if;
  required_role:=case p_department_key when 'finance' then 'cfo' when 'marketing' then 'cmo' when 'operations' then 'coo' when 'technology' then 'cto' when 'people' then 'chro' end;
  if member_role<>'ceo' and member_role<>required_role then raise exception 'Your role does not own this department'; end if;
  select * into settings_row from public.business_org_settings where business_id=p_business_id;
  needs_cfo:=p_department_key<>'finance' and p_amount>=settings_row.finance_review_threshold;
  needs_ceo:=member_role<>'ceo' or p_amount>=settings_row.ceo_approval_threshold;
  if needs_cfo then needs_ceo:=true; end if;
  insert into public.business_proposals(business_id,creator_id,department_key,proposal_type,title,description,amount,expected_impact,status,current_step) values(p_business_id,actor,p_department_key,p_proposal_type,trim(p_title),trim(p_description),p_amount,coalesce(p_expected_impact,'{}'::jsonb),'submitted',1) returning id into proposal_id;
  if needs_cfo then insert into public.business_proposal_steps(proposal_id,step_order,required_role) values(proposal_id,step_counter,'cfo'); step_counter:=step_counter+1; end if;
  if needs_ceo then insert into public.business_proposal_steps(proposal_id,step_order,required_role) values(proposal_id,step_counter,'ceo'); end if;
  if not needs_cfo and not needs_ceo then update public.business_proposals set status='approved',updated_at=now() where id=proposal_id; end if;
  insert into public.business_events(business_id,actor_id,event_type,summary,metadata) values(p_business_id,actor,'proposal_submitted',case when needs_cfo or needs_ceo then 'New business proposal submitted' else 'Proposal auto-approved under delegated authority' end,jsonb_build_object('proposal_id',proposal_id,'department',p_department_key,'amount',p_amount));
  return proposal_id;
end;
$$;
revoke all on function public.create_business_proposal(uuid,text,text,text,text,numeric,jsonb) from public, anon;
grant execute on function public.create_business_proposal(uuid,text,text,text,text,numeric,jsonb) to authenticated;

create or replace function public.revise_business_proposal(p_proposal_id uuid,p_title text,p_description text,p_amount numeric,p_expected_impact jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=public
as $$
declare actor uuid:=(select auth.uid()); proposal public.business_proposals%rowtype; settings_row public.business_org_settings%rowtype; creator_role text; department_owner text; step_counter integer:=1; needs_cfo boolean; needs_ceo boolean;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if length(trim(p_title))<3 or length(trim(p_title))>160 then raise exception 'Proposal title must be between 3 and 160 characters'; end if;
  if p_amount<0 then raise exception 'Proposal amount cannot be negative'; end if;
  select * into proposal from public.business_proposals where id=p_proposal_id for update;
  if not found or not public.is_business_member(proposal.business_id) then raise exception 'Proposal not found'; end if;
  if proposal.creator_id<>actor or proposal.status<>'needs_changes' then raise exception 'Only the creator can revise a proposal that needs changes'; end if;
  select role into creator_role from public.business_members where business_id=proposal.business_id and user_id=actor;
  department_owner:=case proposal.department_key when 'finance' then 'cfo' when 'marketing' then 'cmo' when 'operations' then 'coo' when 'technology' then 'cto' when 'people' then 'chro' end;
  if creator_role<>'ceo' and creator_role<>department_owner then raise exception 'Your role no longer owns this department'; end if;
  select * into settings_row from public.business_org_settings where business_id=proposal.business_id;
  needs_cfo:=proposal.department_key<>'finance' and p_amount>=settings_row.finance_review_threshold;
  needs_ceo:=creator_role<>'ceo' or p_amount>=settings_row.ceo_approval_threshold;
  if needs_cfo then needs_ceo:=true; end if;
  delete from public.business_proposal_steps where proposal_id=proposal.id;
  update public.business_proposals set title=trim(p_title),description=trim(p_description),amount=p_amount,expected_impact=coalesce(p_expected_impact,'{}'::jsonb),status='submitted',current_step=1,updated_at=now() where id=proposal.id;
  if needs_cfo then insert into public.business_proposal_steps(proposal_id,step_order,required_role) values(proposal.id,step_counter,'cfo'); step_counter:=step_counter+1; end if;
  if needs_ceo then insert into public.business_proposal_steps(proposal_id,step_order,required_role) values(proposal.id,step_counter,'ceo'); end if;
  if not needs_cfo and not needs_ceo then update public.business_proposals set status='approved',updated_at=now() where id=proposal.id; end if;
  insert into public.business_events(business_id,actor_id,event_type,summary,metadata) values(proposal.business_id,actor,'proposal_revised','Proposal revised and resubmitted',jsonb_build_object('proposal_id',proposal.id));
  return proposal.id;
end;
$$;
revoke all on function public.revise_business_proposal(uuid,text,text,numeric,jsonb) from public, anon;
grant execute on function public.revise_business_proposal(uuid,text,text,numeric,jsonb) to authenticated;
