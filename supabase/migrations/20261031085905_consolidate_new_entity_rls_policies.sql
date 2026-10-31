-- Consolidate policies so each action has a single permissive policy per table.
-- This preserves the same access rules while avoiding policy overlap.

DROP POLICY IF EXISTS app_admin_all ON public.agency_links;
DROP POLICY IF EXISTS agency_links_requester_select ON public.agency_links;
DROP POLICY IF EXISTS agency_links_target_select ON public.agency_links;
DROP POLICY IF EXISTS agency_links_requester_insert ON public.agency_links;
DROP POLICY IF EXISTS agency_links_target_update ON public.agency_links;
CREATE POLICY agency_links_select ON public.agency_links FOR SELECT
  USING (public.app_is_admin() OR requester_user_id = public.app_uid() OR target_code = public.app_ec());
CREATE POLICY agency_links_insert ON public.agency_links FOR INSERT
  WITH CHECK (public.app_is_admin() OR (requester_user_id = public.app_uid() AND requester_code = public.app_ec()));
CREATE POLICY agency_links_update ON public.agency_links FOR UPDATE
  USING (public.app_is_admin() OR target_code = public.app_ec())
  WITH CHECK (public.app_is_admin() OR target_code = public.app_ec());
CREATE POLICY agency_links_delete ON public.agency_links FOR DELETE
  USING (public.app_is_admin());

DROP POLICY IF EXISTS app_admin_all ON public.user_notifications;
DROP POLICY IF EXISTS user_notifications_owner_select ON public.user_notifications;
DROP POLICY IF EXISTS user_notifications_owner_update ON public.user_notifications;
CREATE POLICY user_notifications_select ON public.user_notifications FOR SELECT
  USING (public.app_is_admin() OR target_user_id = public.app_uid()::text OR target_role = 'all' OR target_role = (public.app_claims() ->> 'r'));
CREATE POLICY user_notifications_insert ON public.user_notifications FOR INSERT
  WITH CHECK (public.app_is_admin());
CREATE POLICY user_notifications_update ON public.user_notifications FOR UPDATE
  USING (public.app_is_admin() OR target_user_id = public.app_uid()::text OR target_role = 'all' OR target_role = (public.app_claims() ->> 'r'))
  WITH CHECK (public.app_is_admin() OR target_user_id = public.app_uid()::text OR target_role = 'all' OR target_role = (public.app_claims() ->> 'r'));
CREATE POLICY user_notifications_delete ON public.user_notifications FOR DELETE
  USING (public.app_is_admin());

DROP POLICY IF EXISTS app_admin_all ON public.wallet_topup_requests;
DROP POLICY IF EXISTS wallet_topup_owner_insert ON public.wallet_topup_requests;
DROP POLICY IF EXISTS wallet_topup_owner_select ON public.wallet_topup_requests;
CREATE POLICY wallet_topup_select ON public.wallet_topup_requests FOR SELECT
  USING (public.app_is_admin() OR user_id = public.app_uid()::text);
CREATE POLICY wallet_topup_insert ON public.wallet_topup_requests FOR INSERT
  WITH CHECK (public.app_is_admin() OR (user_id = public.app_uid()::text AND exchange_code = public.app_ec()));
CREATE POLICY wallet_topup_update ON public.wallet_topup_requests FOR UPDATE
  USING (public.app_is_admin()) WITH CHECK (public.app_is_admin());
CREATE POLICY wallet_topup_delete ON public.wallet_topup_requests FOR DELETE
  USING (public.app_is_admin());

DROP POLICY IF EXISTS app_admin_all ON public.backup_records;
DROP POLICY IF EXISTS backup_records_owner_all ON public.backup_records;
CREATE POLICY backup_records_select ON public.backup_records FOR SELECT
  USING (public.app_is_admin() OR (user_id = public.app_uid()::text AND exchange_code = public.app_ec()));
CREATE POLICY backup_records_insert ON public.backup_records FOR INSERT
  WITH CHECK (public.app_is_admin() OR (user_id = public.app_uid()::text AND exchange_code = public.app_ec()));
CREATE POLICY backup_records_update ON public.backup_records FOR UPDATE
  USING (public.app_is_admin() OR (user_id = public.app_uid()::text AND exchange_code = public.app_ec()))
  WITH CHECK (public.app_is_admin() OR (user_id = public.app_uid()::text AND exchange_code = public.app_ec()));
CREATE POLICY backup_records_delete ON public.backup_records FOR DELETE
  USING (public.app_is_admin() OR (user_id = public.app_uid()::text AND exchange_code = public.app_ec()));

DROP POLICY IF EXISTS app_admin_all ON public.recharge_orders;
DROP POLICY IF EXISTS recharge_orders_sarraaf_all ON public.recharge_orders;
CREATE POLICY recharge_orders_select ON public.recharge_orders FOR SELECT
  USING (public.app_is_admin() OR (exchange_code = public.app_ec() AND (public.app_claims() ->> 'r') = 'sarraaf'));
CREATE POLICY recharge_orders_insert ON public.recharge_orders FOR INSERT
  WITH CHECK (public.app_is_admin() OR (exchange_code = public.app_ec() AND (public.app_claims() ->> 'r') = 'sarraaf'));
CREATE POLICY recharge_orders_update ON public.recharge_orders FOR UPDATE
  USING (public.app_is_admin() OR (exchange_code = public.app_ec() AND (public.app_claims() ->> 'r') = 'sarraaf'))
  WITH CHECK (public.app_is_admin() OR (exchange_code = public.app_ec() AND (public.app_claims() ->> 'r') = 'sarraaf'));
CREATE POLICY recharge_orders_delete ON public.recharge_orders FOR DELETE
  USING (public.app_is_admin() OR (exchange_code = public.app_ec() AND (public.app_claims() ->> 'r') = 'sarraaf'));
