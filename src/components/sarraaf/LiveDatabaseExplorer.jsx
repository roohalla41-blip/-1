import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { callSupabase } from '@/lib/supabaseApi';

// پنل دیتابیس در A1 عمداً فقط‌خواندنی است.
// هیچ مسیر ایجاد، ویرایش یا حذف رکوردی از این رابط فراخوانی نمی‌شود.
export default function LiveDatabaseExplorer() {
  const { toast } = useToast();
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loadingRows, setLoadingRows] = useState(false);
  const [searchCol, setSearchCol] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortAsc, setSortAsc] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const res = await callSupabase('dbExplorer', { sub_action: 'listTables' });
      if (res.success) {
        setTables(res.tables || []);
        setConnectionError(false);
      } else {
        setConnectionError(true);
        toast({
          title: res.error === 'forbidden' ? 'دسترسی محدود' : 'خطا در دریافت جدول‌ها',
          description: res.error === 'forbidden'
            ? 'فقط سازندهٔ مجاز می‌تواند فرادادهٔ دیتابیس را مشاهده کند.'
            : (res.error || 'خطای ناشناخته'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionError(true);
      toast({ title: 'خطا در اتصال', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingTables(false);
    }
  }, [toast]);

  const loadRows = useCallback(async () => {
    if (!selectedTable) return;
    setLoadingRows(true);
    try {
      const res = await callSupabase('dbExplorer', {
        sub_action: 'listRows',
        table: selectedTable.table_name,
        page,
        page_size: pageSize,
        sort_col: sortCol,
        sort_asc: sortAsc,
        search: searchCol && searchVal ? { column: searchCol, value: searchVal } : null,
      });
      if (res.success) {
        setRows(res.rows || []);
        setTotal(res.total || 0);
        setConnectionError(false);
      } else {
        setConnectionError(true);
        toast({ title: 'خطا در دریافت اطلاعات', description: res.error || 'خطای ناشناخته', variant: 'destructive' });
      }
    } catch (error) {
      setConnectionError(true);
      toast({ title: 'خطا در دریافت اطلاعات', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingRows(false);
    }
  }, [selectedTable, page, pageSize, sortCol, sortAsc, searchCol, searchVal, toast]);

  useEffect(() => { loadTables(); }, [loadTables]);
  useEffect(() => { if (selectedTable) loadRows(); }, [selectedTable, page, sortCol, sortAsc, loadRows]);

  const handleSearch = () => {
    if (page !== 1) setPage(1);
    else loadRows();
  };

  const columns = selectedTable?.columns || [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">پایگاه داده زنده — فقط مشاهده</h3>
                <p className="text-[11px] text-muted-foreground">مشاهدهٔ نام جدول‌ها، شمار رکوردها و اطلاعات صفحه‌بندی‌شده؛ بدون امکان تغییر داده</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadTables} disabled={loadingTables}>
              <RefreshCw className={`w-3.5 h-3.5 ml-1 ${loadingTables ? 'animate-spin' : ''}`} />
              به‌روزرسانی
            </Button>
          </div>

          <div className="rounded-lg border border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 mb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                برای محافظت از اطلاعات واقعی A1، ایجاد، ویرایش و حذف رکورد از این پنل غیرفعال است. این بخش فقط برای بررسی و گزارش‌گیری است.
              </p>
            </div>
          </div>

          {connectionError && (
            <div className="text-xs text-destructive mb-3">دریافت اطلاعات با خطا روبه‌رو شد. وضعیت دسترسی یا اتصال را بررسی کنید.</div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {loadingTables ? (
              <span className="text-xs text-muted-foreground">در حال بارگذاری جدول‌ها…</span>
            ) : tables.length === 0 ? (
              <span className="text-xs text-muted-foreground">جدولی برای نمایش دریافت نشد.</span>
            ) : tables.map(table => (
              <button
                key={table.table_name}
                onClick={() => {
                  setSelectedTable(table);
                  setPage(1);
                  setSearchCol('');
                  setSearchVal('');
                  setSortCol('id');
                  setSortAsc(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedTable?.table_name === table.table_name
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-accent border-border'
                }`}
              >
                {table.table_name}
                <span className="opacity-60 mr-1">({table.row_count ?? '—'})</span>
              </button>
            ))}
          </div>

          {selectedTable && (
            <>
              <div className="flex flex-wrap gap-2 items-end mb-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">ستون جست‌وجو</Label>
                  <Select value={searchCol} onValueChange={setSearchCol}>
                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="انتخاب ستون" /></SelectTrigger>
                    <SelectContent>
                      {columns.map(column => (
                        <SelectItem key={column.column_name} value={column.column_name} className="text-xs">
                          {column.column_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">مقدار جست‌وجو</Label>
                  <Input
                    className="h-8 w-40 text-xs"
                    value={searchVal}
                    onChange={event => setSearchVal(event.target.value)}
                    placeholder="متن جست‌وجو…"
                    onKeyDown={event => event.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button size="sm" variant="secondary" className="h-8" onClick={handleSearch} disabled={loadingRows}>
                  <Search className="w-3.5 h-3.5 ml-1" /> جست‌وجو
                </Button>
                <Button size="sm" variant="outline" className="h-8" onClick={() => {
                  setSearchCol('');
                  setSearchVal('');
                  if (page !== 1) setPage(1);
                  else loadRows();
                }}>
                  پاک‌کردن فیلتر
                </Button>
              </div>

              {loadingRows ? (
                <div className="py-8 text-center text-xs text-muted-foreground">در حال بارگذاری…</div>
              ) : rows.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">ردیفی برای نمایش یافت نشد.</div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {columns.map(column => (
                          <th key={column.column_name} className="text-right p-2 font-medium whitespace-nowrap">
                            <button
                              className="hover:text-primary"
                              onClick={() => {
                                setSortCol(column.column_name);
                                setSortAsc(sortCol === column.column_name ? !sortAsc : true);
                                setPage(1);
                              }}
                            >
                              {column.column_name}
                              {sortCol === column.column_name && <span className="mr-0.5">{sortAsc ? '↑' : '↓'}</span>}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.id ?? index} className="border-b hover:bg-muted/30">
                          {columns.map(column => {
                            const value = row[column.column_name];
                            const display = value === null || value === undefined
                              ? '—'
                              : (typeof value === 'object' ? JSON.stringify(value).slice(0, 80) : String(value));
                            return (
                              <td key={column.column_name} className="p-2 whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis" title={display}>
                                {display.length > 80 ? display.slice(0, 77) + '…' : display}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {total > pageSize && (
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-muted-foreground">
                    {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} از {total}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs self-center px-2">{page} / {totalPages}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(current => current + 1)}>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
