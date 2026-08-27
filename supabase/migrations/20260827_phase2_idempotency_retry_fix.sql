-- A committed idempotent request must remain replayable even after another player
-- advances the room. Therefore request lookup precedes current-round validation.
create or replace function public.phase22_submit_decision(p_room_id uuid,p_round integer,p_decision_id text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid := (select auth.uid()); room public.competition_rooms%rowtype; existing_request public.competition_request_keys%rowtype; player_count integer; submission_count integer; next_round integer; completed boolean:=false; final_results jsonb:='[]'::jsonb; result jsonb; fingerprint jsonb;
begin
 if actor is null then raise exception 'Authentication required'; end if;
 if p_room_id is null then raise exception 'Room ID is required'; end if;
 if p_request_id is null then raise exception 'Request ID is required'; end if;
 if p_round < 1 then raise exception 'Invalid round'; end if;
 fingerprint:=jsonb_build_object('user_id',actor,'room_id',p_room_id,'round',p_round,'decision_id',lower(trim(coalesce(p_decision_id,''))));
 if fingerprint->>'decision_id' not in ('balanced_growth','aggressive_growth','defensive_cash') then raise exception 'Unsupported competition decision'; end if;
 select * into existing_request from public.competition_request_keys where request_id=p_request_id for update;
 if found then
   if existing_request.user_id<>actor or existing_request.room_id<>p_room_id or existing_request.round<>p_round or existing_request.request_fingerprint<>fingerprint then raise exception 'Request ID was already used for a different action'; end if;
   return existing_request.response;
 end if;
 select * into room from public.competition_rooms where id=p_room_id for update;
 if not found then raise exception 'Competition room not found'; end if;
 if room.status<>'active' then raise exception 'Competition is not active'; end if;
 if room.current_round<>p_round then raise exception 'This round is no longer active'; end if;
 if not exists(select 1 from public.competition_players where room_id=room.id and user_id=actor) then raise exception 'Player is not in this room'; end if;
 insert into public.competition_request_keys(request_id,user_id,room_id,round,request_fingerprint,response) values(p_request_id,actor,room.id,p_round,fingerprint,'{}'::jsonb);
 insert into public.competition_submissions(room_id,user_id,round,decision_id) values(room.id,actor,p_round,fingerprint->>'decision_id');
 select count(*) into player_count from public.competition_players where room_id=room.id;
 select count(*) into submission_count from public.competition_submissions where room_id=room.id and round=p_round;
 next_round:=room.current_round;
 if submission_count>=player_count then
   if room.current_round>=room.duration_rounds then
     update public.competition_rooms set status='completed',current_round=room.current_round,state_version=state_version+1,updated_at=now() where id=room.id;
     completed:=true;
     insert into public.competition_events(room_id,round,actor_id,event_type,event_version,payload)
     select room.id,room.current_round,actor,'round_completed',state_version,jsonb_build_object('submitted',submission_count,'players',player_count) from public.competition_rooms where id=room.id;
     final_results:=public.phase22_finalize_completed_room(room.id)->'results';
   else
     next_round:=room.current_round+1;
     update public.competition_rooms set current_round=next_round,state_version=state_version+1,updated_at=now() where id=room.id;
     insert into public.competition_events(room_id,round,actor_id,event_type,event_version,payload)
     select room.id,room.current_round,actor,'round_completed',state_version,jsonb_build_object('submitted',submission_count,'players',player_count,'next_round',next_round) from public.competition_rooms where id=room.id;
   end if;
 else
   update public.competition_rooms set state_version=state_version+1,updated_at=now() where id=room.id;
   insert into public.competition_events(room_id,round,actor_id,event_type,event_version,payload)
   select room.id,room.current_round,actor,'decision_submitted',state_version,jsonb_build_object('submitted',submission_count,'players',player_count) from public.competition_rooms where id=room.id;
 end if;
 select jsonb_build_object('submitted',submission_count,'players',player_count,'round_resolved',submission_count>=player_count,'completed',completed,'current_round',next_round,'results',final_results,'state_version',state_version) into result from public.competition_rooms where id=room.id;
 update public.competition_request_keys set response=result where request_id=p_request_id;
 return result;
end;
$$;
revoke all on function public.phase22_submit_decision(uuid,integer,text,uuid) from public,anon;
grant execute on function public.phase22_submit_decision(uuid,integer,text,uuid) to authenticated;
