-- Executar DESPRÉS de supabase.sql al SQL Editor (projecte de proves preferible).
-- Crea dades fictícies dins una transacció i les desfà amb ROLLBACK.
-- Si hi ha un error, executar ROLLBACK abans de qualsevol altra consulta.
begin;
select set_config('test.user_a',gen_random_uuid()::text,true);
select set_config('test.user_b',gen_random_uuid()::text,true);
select set_config('test.user_c',gen_random_uuid()::text,true);
select set_config('test.family_a',gen_random_uuid()::text,true);
select set_config('test.family_c',gen_random_uuid()::text,true);
select set_config('test.pet_a',gen_random_uuid()::text,true);
select set_config('test.pet_c',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('test.user_a')::uuid),(current_setting('test.user_b')::uuid),(current_setting('test.user_c')::uuid);
insert into public.families(id,name) values(current_setting('test.family_a')::uuid,'TEST A'),(current_setting('test.family_c')::uuid,'TEST C');
insert into public.family_members(family_id,user_id) values
 (current_setting('test.family_a')::uuid,current_setting('test.user_a')::uuid),
 (current_setting('test.family_a')::uuid,current_setting('test.user_b')::uuid),
 (current_setting('test.family_c')::uuid,current_setting('test.user_c')::uuid);
insert into public.pets(id,family_id,name) values
 (current_setting('test.pet_a')::uuid,current_setting('test.family_a')::uuid,'TEST pet A'),
 (current_setting('test.pet_c')::uuid,current_setting('test.family_c')::uuid,'TEST pet C');
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
do $$ begin
 if (select count(*) from public.pets where id=current_setting('test.pet_a')::uuid)<>1 then raise exception 'FAIL: A no veu el seu animal'; end if;
 if exists(select 1 from public.pets where id=current_setting('test.pet_c')::uuid) then raise exception 'FAIL: A veu C'; end if;
 insert into public.events(family_id,pet_id,kind,title,event_date) values(current_setting('test.family_a')::uuid,current_setting('test.pet_a')::uuid,'Visita','TEST compartit',current_date);
 begin
  insert into public.events(family_id,pet_id,kind,title,event_date) values(current_setting('test.family_a')::uuid,current_setting('test.pet_c')::uuid,'Visita','TEST creuat',current_date);
  raise exception 'FAIL: FK permet animal d''una altra família';
 exception when foreign_key_violation then null; end;
 begin
  update public.pets set family_id=current_setting('test.family_c')::uuid where id=current_setting('test.pet_a')::uuid;
  raise exception 'FAIL: canvi de família permès';
 exception when insufficient_privilege then null; end;
 if has_table_privilege('authenticated','public.family_members','INSERT') or has_table_privilege('authenticated','public.family_members','UPDATE') then raise exception 'FAIL: client pot alterar membresia'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_b'),true);
do $$ begin
 if (select count(*) from public.events where family_id=current_setting('test.family_a')::uuid)<>1 then raise exception 'FAIL: B no veu registre compartit'; end if;
 update public.events set title='TEST editat per B' where family_id=current_setting('test.family_a')::uuid;
 if not found then raise exception 'FAIL: B no pot editar'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_c'),true);
do $$ begin
 if exists(select 1 from public.events where family_id=current_setting('test.family_a')::uuid) then raise exception 'FAIL: C veu A'; end if;
 delete from public.pets where id=current_setting('test.pet_a')::uuid;
 if found then raise exception 'FAIL: C pot eliminar animal A'; end if;
 begin
  insert into public.pets(family_id,name) values(current_setting('test.family_a')::uuid,'Intrús');
  raise exception 'FAIL: C pot inserir a A';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin
  perform 1 from public.pets;
  raise exception 'FAIL: anon té permisos de lectura';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Proves SQL superades; dades fictícies desfetes.' as resultat;
