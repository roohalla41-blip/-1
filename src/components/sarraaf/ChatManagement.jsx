import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useChatGroups } from '@/lib/useChat';
import { AlertTriangle, Globe, Lock, Users } from 'lucide-react';

export default function ChatManagement() {
  const { data: groups, isLoading, error } = useChatGroups();

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <h3 className="text-sm font-semibold">مشاهده گروه‌های چت</h3>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            برای حفاظت از پیام‌ها و اعضای موجود، ایجاد، ویرایش، حذف و ساخت خودکار گروه‌ها فعلاً غیرفعال است. فعال‌سازی مدیریت تغییردهنده پس از بررسی روابط داده‌ها و تأیید جداگانه انجام می‌شود.
          </p>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">در حال بارگذاری گروه‌ها...</p>
        ) : error ? (
          <p className="text-xs text-destructive">بارگذاری گروه‌ها ناموفق بود: {error.message || 'خطای نامشخص'}</p>
        ) : !groups || groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">گروهی برای نمایش پیدا نشد؛ این پیام به معنی مجاز بودن ایجاد خودکار گروه نیست.</p>
        ) : (
          <div className="space-y-2">
            {groups.map(group => (
              <div key={group.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {group.type === 'private' ? (
                      <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{group.name}</span>
                  </div>
                  {group.description && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{group.description}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {group.type === 'private' ? 'خصوصی' : 'عمومی'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
