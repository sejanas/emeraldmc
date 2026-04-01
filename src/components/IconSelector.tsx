import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { icons } from "lucide-react";

interface IconSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

const IconSelector = ({ open, onClose, onSelect, currentIcon }: IconSelectorProps) => {
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    const entries = Object.entries(icons);
    if (!search.trim()) return entries.slice(0, 80);
    const q = search.toLowerCase();
    return entries.filter(([name]) => name.toLowerCase().includes(q)).slice(0, 80);
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setSearch(""); } }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-6 gap-2 overflow-y-auto flex-1 py-2 min-h-0">
          {filteredIcons.map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              onClick={() => { onSelect(name); onClose(); setSearch(""); }}
              className={`flex flex-col items-center gap-1 rounded-lg p-3 transition-colors hover:bg-accent ${
                currentIcon === name ? "bg-primary/10 ring-2 ring-primary" : ""
              }`}
              title={name}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">{name}</span>
            </button>
          ))}
          {filteredIcons.length === 0 && (
            <p className="col-span-6 text-center text-sm text-muted-foreground py-8">No icons match &ldquo;{search}&rdquo;</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconSelector;
