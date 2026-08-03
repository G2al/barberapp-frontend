import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({ pending, children, className, ...props }: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  return <Button type="submit" disabled={pending || props.disabled} className={cn("h-12 w-full rounded-2xl bg-amber-300 px-5 font-semibold text-zinc-950 hover:bg-amber-200", className)} {...props}>{pending && <LoaderCircle className="animate-spin" />}{children}</Button>;
}
