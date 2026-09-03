insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists product_images_service_write on storage.objects;
create policy product_images_service_write
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists product_images_service_update on storage.objects;
create policy product_images_service_update
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');
