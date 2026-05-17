"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { DAYS, type DayKey, type WeeklyHours } from "@/lib/types";

export function HoursEditor({
  value,
  onChange,
}: {
  value: WeeklyHours;
  onChange: (next: WeeklyHours) => void;
}) {
  function setDay(key: DayKey, patch: Partial<WeeklyHours[DayKey]>) {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  }

  return (
    <div className="flex flex-col">
      {DAYS.map(({ key, label }) => {
        const day = value[key];
        return (
          <div
            key={key}
            className="grid grid-cols-[120px_1fr_auto_auto] items-center gap-4 border-b border-border py-3 last:border-b-0"
          >
            <span className="text-sm font-medium uppercase tracking-[0.1em]">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <Switch
                checked={!day.closed}
                onCheckedChange={(checked) =>
                  setDay(key, { closed: !checked })
                }
              />
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {day.closed ? "Cerrado" : "Abierto"}
              </span>
            </div>
            <Input
              type="time"
              value={day.open}
              disabled={day.closed}
              onChange={(e) => setDay(key, { open: e.target.value })}
              className="w-32"
            />
            <Input
              type="time"
              value={day.close}
              disabled={day.closed}
              onChange={(e) => setDay(key, { close: e.target.value })}
              className="w-32"
            />
          </div>
        );
      })}
    </div>
  );
}
