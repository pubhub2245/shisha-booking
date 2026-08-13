-- 多重防御：anon に profiles の UPDATE は不要（RLS で auth.uid()=id により元々ブロック済み）。
revoke update on public.profiles from anon;
