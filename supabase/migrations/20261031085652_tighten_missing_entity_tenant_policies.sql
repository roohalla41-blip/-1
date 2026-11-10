DROP POLICY IF EXISTS app_tenant_all ON public.wallet_topup_requests;
DROP POLICY IF EXISTS app_tenant_all ON public.recharge_orders;
DROP POLICY IF EXISTS recharge_orders_sarraaf_all ON public.recharge_orders;
CREATE POLICY recharge_orders_sarraaf_all ON public.recharge_orders FOR ALL
  USING (exchange_code = public.app_ec() AND (public.app_claims() ->> 'r') = 'sarraaf')
  WITH CHECK (exchange_code = public.app_ec() AND (public.app_claims() ->> 'r') = 'sarraaf');
