"use client";

import { useState, useTransition } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
  //@ts-ignore
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X,
  MapPin
} from "lucide-react";
import { 
  addCostCenterAction, 
  updateCostCenterAction, 
  deleteCostCenterAction 
} from "./actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CostCenter {
  id: string;
  name: string;
  created_at: string;
}

interface Props {
  initialData: CostCenter[];
  title: string;
  description: string;
}

export function CostCenterManager({ initialData, title, description }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  
  // ì¶”ê? ëª¨ë‹¬ ê´€???íƒœ
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleEditStart = (item: CostCenter) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;

    startTransition(async () => {
      const result = await updateCostCenterAction(editingId, editName);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("ì½”ìŠ¤?¸ì„¼???•ë³´ê°€ ?˜ì •?˜ì—ˆ?µë‹ˆ??");
        setEditingId(null);
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' ì½”ìŠ¤?¸ì„¼?°ë? ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?\n??ì½”ìŠ¤?¸ì„¼?°ë? ?¬ìš©?˜ëŠ” ê³ ê°?¬ê? ?ˆì„ ê²½ìš° ?? œê°€ ?¤íŒ¨?????ˆìŠµ?ˆë‹¤.`)) return;

    startTransition(async () => {
      const result = await deleteCostCenterAction(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("ì½”ìŠ¤?¸ì„¼?°ê? ?? œ?˜ì—ˆ?µë‹ˆ??");
      }
    });
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("ì½”ìŠ¤?¸ì„¼??ëª…ì¹­???…ë ¥?´ì£¼?¸ìš”.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", newName);
      const result = await addCostCenterAction(fd);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("?ˆë¡œ??ì½”ìŠ¤?¸ì„¼?°ê? ì¶”ê??˜ì—ˆ?µë‹ˆ??");
        setIsAddOpen(false);
        setNewName("");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xl bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* ?µí•© ?¤ë” ?ì—­ */}
        <div className="px-3 py-3 flex justify-between items-center border-b border-slate-100 bg-slate-50/30">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-slate-500 font-medium text-[11px] mt-1">{description}</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-[#414344] text-white hover:bg-[#414344]/90 shadow-md">
            <Plus className="w-4 h-4" />
            {title.replace(" ê´€ë¦?, "")} ì¶”ê?
          </Button>
        </div>

        <Table className="text-xs">
          <TableHeader className="bg-slate-800">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[60px] font-black text-slate-300 border-r border-slate-700/50 text-center h-10 text-[12px] uppercase tracking-wider px-4">#</TableHead>
              <TableHead className="font-black text-slate-300 border-r border-slate-700/50 h-10 text-[12px] uppercase tracking-wider px-4">ì½”ìŠ¤?¸ì„¼??ëª…ì¹­</TableHead>
              <TableHead className="w-[200px] font-black text-slate-300 border-r border-slate-700/50 text-center h-10 text-[12px] uppercase tracking-wider px-4">?±ë¡??/TableHead>
              <TableHead className="w-[120px] font-black text-slate-300 text-center h-10 text-[12px] uppercase tracking-wider px-4">ê´€ë¦?/TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.map((item, index) => (
              <TableRow key={item.id} className="border-b border-slate-100 transition-all hover:bg-slate-50/50 group">
                <TableCell className="py-3.5 px-4 border-r border-slate-100 text-center text-slate-400 font-bold">
                  {index + 1}
                </TableCell>
                <TableCell className="py-2 px-4 border-r border-slate-100 align-middle">
                  {editingId === item.id ? (
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9 font-bold border-slate-200 rounded-lg text-xs"
                      autoFocus
                    />
                  ) : (
                    <span className="text-slate-900 font-bold">{item.name}</span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-4 border-r border-slate-100 text-center align-middle text-slate-500 font-medium">
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-2 px-4 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    {editingId === item.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          onClick={handleUpdate}
                          disabled={isPending}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-300 hover:bg-slate-50 rounded-lg"
                          onClick={handleEditCancel}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-400 hover:bg-blue-50 rounded-lg"
                          onClick={() => handleEditStart(item)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          onClick={() => handleDelete(item.id, item.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {initialData.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-slate-400 font-bold">
                  ?±ë¡??ì½”ìŠ¤?¸ì„¼?°ê? ?†ìŠµ?ˆë‹¤.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ì½”ìŠ¤?¸ì„¼??ì¶”ê? ?¤ì´?¼ë¡œê·?*/}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>??ì½”ìŠ¤?¸ì„¼??ì¶”ê?</DialogTitle>
            <DialogDescription>
              ?œìŠ¤?œì— ?±ë¡???ˆë¡œ??ì½”ìŠ¤?¸ì„¼??ëª…ì¹­???…ë ¥?˜ì„¸??
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">ëª…ì¹­</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                placeholder="ì½”ìŠ¤?¸ì„¼???´ë¦„ ?…ë ¥"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>ì·¨ì†Œ</Button>
            <Button onClick={handleAdd} disabled={isPending} className="bg-[#414344] text-white hover:bg-[#414344]/90">
              {isPending ? "ì¶”ê? ì¤?.." : "ì¶”ê??˜ê¸°"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
