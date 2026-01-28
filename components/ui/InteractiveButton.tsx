import Link from "next/link";
import clsx from "clsx";

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary";
}

export const InteractiveButton = ({ children, className, href, variant = "primary", ...props }: InteractiveButtonProps) => {
  const baseStyles = "px-9 py-4 rounded-full font-black uppercase tracking-widest text-[13px] transition-all duration-300 active:scale-95 shadow-lg flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 border border-indigo-400/20",
    secondary: "bg-slate-100 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 hover:border-slate-300 dark:hover:border-white/40 shadow-black/10",
  };

  const content = (
    <button className={clsx(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );

  if (href) {
    return <Link href={href} className="inline-block">{content}</Link>;
  }

  return content;
};
