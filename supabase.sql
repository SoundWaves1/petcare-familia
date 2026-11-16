-- PetCare Família v1. NOMÉS per a un projecte sense aquestes taules.
-- Una transacció: si un nom ja existeix, s'atura sense substituir dades.
begin;
create table public.families (
 id uuid primary key default gen_random_uuid(), name text not null
);
create table public.family_members (
 family_id uuid not null references public.families(id),
 user_id uuid not null references auth.users(id),
 primary key(family_id,user_id)
);
create index on public.family_members(user_id);
create table public.pets (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id),
 name text not null check(length(name) between 1 and 100),
 species text not null default '', breed text not null default '',
 birth_date date, microchip text not null default '', notes text not null default '',
 unique(family_id,id)
);
create index on public.pets(family_id);
create table public.events (
 id uuid primary key default gen_random_uuid(), family_id uuid not null,
 pet_id uuid not null, kind text not null check(kind in
 ('Visita','Vacuna','Medicament','Desparasitació','Pes','Recordatori')),
 title text not null check(length(title) between 1 and 200),
 event_date date not null, next_date date, notes text not null default '',
 weight_kg numeric(7,3) check(weight_kg > 0),
 cost_eur numeric(10,2) check(cost_eur >= 0),
 created_at timestamptz not null default now(),
 foreign key(family_id,pet_id) references public.pets(family_id,id)
);
create index on public.events(family_id,pet_id,event_date);
create table public.documents (
 id uuid primary key default gen_random_uuid(), family_id uuid not null,
 pet_id uuid not null, name text not null, object_path text not null unique,
 created_at timestamptz not null default now(),
 foreign key(family_id,pet_id) references public.pets(family_id,id),
 check(split_part(object_path,'/',1)=family_id::text
   and split_part(object_path,'/',2)=pet_id::text)
);
create index on public.documents(family_id,pet_id);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.pets enable row level security;
alter table public.events enable row level security;
alter table public.documents enable row level security;

-- Aquesta política NO consulta la seva mateixa taula: evita recursió.
-- No hi ha cap política d'escriptura: només un administrador del projecte
-- pot donar d'alta membres, sense claus administratives al client.
create policy member_self on public.family_members for select to authenticated
 using(user_id=(select auth.uid()));
create policy family_read on public.families for select to authenticated
 using(exists(select 1 from public.family_members m
 where m.family_id=families.id and m.user_id=(select auth.uid())));

create policy pets_member on public.pets for all to authenticated
 using(exists(select 1 from public.family_members m where m.family_id=pets.family_id and m.user_id=(select auth.uid())))
 with check(exists(select 1 from public.family_members m where m.family_id=pets.family_id and m.user_id=(select auth.uid())));
create policy events_member on public.events for all to authenticated
 using(exists(select 1 from public.family_members m where m.family_id=events.family_id and m.user_id=(select auth.uid())))
 with check(exists(select 1 from public.family_members m where m.family_id=events.family_id and m.user_id=(select auth.uid())));
create policy documents_member on public.documents for all to authenticated
 using(exists(select 1 from public.family_members m where m.family_id=documents.family_id and m.user_id=(select auth.uid())))
 with check(exists(select 1 from public.family_members m where m.family_id=documents.family_id and m.user_id=(select auth.uid())));

revoke all on public.families,public.family_members,public.pets,public.events,public.documents from public,anon,authenticated;
grant select on public.families,public.family_members to authenticated;
grant select,insert,update,delete on public.pets,public.events,public.documents to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('petcare-documents','petcare-documents',false,10485760,
 array['application/pdf','image/jpeg','image/png','image/webp']);
create policy petcare_files_read on storage.objects for select to authenticated
 using(bucket_id='petcare-documents' and exists(select 1 from public.family_members m
 where m.family_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())));
create policy petcare_files_insert on storage.objects for insert to authenticated
 with check(bucket_id='petcare-documents' and exists(select 1 from public.family_members m
 join public.pets p on p.family_id=m.family_id
 where m.family_id::text=(storage.foldername(name))[1]
 and p.id::text=(storage.foldername(name))[2] and m.user_id=(select auth.uid())));
create policy petcare_files_delete on storage.objects for delete to authenticated
 using(bucket_id='petcare-documents' and exists(select 1 from public.family_members m
 where m.family_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())));
-- Sense UPDATE: cada pujada té un nom nou, no hi ha sobreescriptura.
commit;
