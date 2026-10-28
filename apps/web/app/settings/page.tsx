import Link from "next/link";
import { SettingsForm } from "@/components/SettingsForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Settings" />
      <SettingsForm />
      <Link href="/settings/needs">
        <Card className="flex items-center justify-between p-4 transition-colors hover:border-accent-300">
          <div>
            <p className="font-semibold text-slate-900">Your training needs</p>
            <p className="text-sm text-slate-500">Goal, experience, days, equipment and limitations</p>
          </div>
          <span aria-hidden className="text-slate-400">
            ›
          </span>
        </Card>
      </Link>
      <Link href="/exercises">
        <Card className="flex items-center justify-between p-4 transition-colors hover:border-accent-300">
          <div>
            <p className="font-semibold text-slate-900">Exercises</p>
            <p className="text-sm text-slate-500">View and edit your current working ability</p>
          </div>
          <span aria-hidden className="text-slate-400">
            ›
          </span>
        </Card>
      </Link>
    </div>
  );
}
