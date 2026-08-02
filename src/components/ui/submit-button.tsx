import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({ pending, children, ...props }: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  return <Button type="submit" disabled={pending || props.disabled} className="h-12 w-full rounded-2xl bg-amber-300 px-5 font-semibold text-zinc-950 hover:bg-amber-200" {...props}>{pending && <LoaderCircle className="animate-spin" />}{children}</Button>;
}
