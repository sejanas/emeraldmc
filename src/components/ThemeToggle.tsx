import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemeColor, type ThemeMode } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const themes: { value: ThemeColor; label: string; hsl: string }[] = [
  { value: "emerald", label: "Emerald Medical", hsl: "162 63% 35%" },
  { value: "blue", label: "Blue Medical", hsl: "221 83% 53%" },
  { value: "soft", label: "Soft Light", hsl: "158 40% 48%" },
];

const modes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const ThemeToggle = () => {
  const { color, mode, resolvedMode, setColor, setMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme settings">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Color Theme</DropdownMenuLabel>
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setColor(t.value)}
            className={cn("gap-2.5 cursor-pointer", color === t.value && "bg-accent")}
          >
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-border"
              style={{ background: `hsl(${t.hsl})` }}
            />
            {t.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Appearance</DropdownMenuLabel>
        {modes.map((m) => (
          <DropdownMenuItem
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn("gap-2.5 cursor-pointer", mode === m.value && "bg-accent")}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
