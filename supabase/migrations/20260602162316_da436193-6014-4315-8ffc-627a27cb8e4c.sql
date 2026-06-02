-- Policies for athlete-photos bucket
CREATE POLICY "athlete photos public read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'athlete-photos');
CREATE POLICY "athlete photos authenticated upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'athlete-photos');
CREATE POLICY "athlete photos authenticated update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'athlete-photos');
CREATE POLICY "athlete photos authenticated delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'athlete-photos');