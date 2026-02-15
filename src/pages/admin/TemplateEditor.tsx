import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getTemplateById, getAllEvents } from "@/data/data-service";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import type { MediaSlot, TextSlot } from "@/data/types";

const AdminTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const events = getAllEvents();
  const existing = id ? getTemplateById(id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [eventId, setEventId] = useState(existing?.eventId ?? events[0]?.id ?? "");
  const [outputType, setOutputType] = useState(existing?.outputType ?? "image");
  const [mediaSlots, setMediaSlots] = useState<MediaSlot[]>(existing?.mediaSlots ?? []);
  const [textSlots, setTextSlots] = useState<TextSlot[]>(existing?.textSlots ?? []);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const addMediaSlot = () => {
    setMediaSlots((p) => [...p, {
      id: `ms-${Date.now()}`, label: "New Photo", type: "photo",
      position: { x: 0, y: 0, width: 50, height: 50 }, required: false,
    }]);
  };

  const addTextSlot = () => {
    setTextSlots((p) => [...p, {
      id: `ts-${Date.now()}`, label: "New Text", placeholder: "Enter text...", maxLength: 100,
      position: { x: 0, y: 0, width: 80, height: 10 },
      style: { fontSize: 16, fontFamily: "Montserrat", color: "#FFFFFF" },
    }]);
  };

  const removeMediaSlot = (idx: number) => setMediaSlots((p) => p.filter((_, i) => i !== idx));
  const removeTextSlot = (idx: number) => setTextSlots((p) => p.filter((_, i) => i !== idx));

  const updateMediaSlot = (idx: number, key: string, value: any) => {
    setMediaSlots((p) => p.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  };

  const updateMediaPos = (idx: number, key: string, value: number) => {
    setMediaSlots((p) => p.map((s, i) => i === idx ? { ...s, position: { ...s.position, [key]: value } } : s));
  };

  const updateTextSlot = (idx: number, key: string, value: any) => {
    setTextSlots((p) => p.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  };

  const updateTextPos = (idx: number, key: string, value: number) => {
    setTextSlots((p) => p.map((s, i) => i === idx ? { ...s, position: { ...s.position, [key]: value } } : s));
  };

  const handleSave = () => {
    toast({ title: "Template saved!", description: `"${name}" has been saved.` });
    navigate("/admin/templates");
  };

  const templateJson = JSON.stringify({ name, eventId, outputType, mediaSlots, textSlots }, null, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{id ? "Edit Template" : "New Template"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/templates")}>Cancel</Button>
          <Button onClick={handleSave}>Save Template</Button>
        </div>
      </div>

      <Tabs defaultValue="visual">
        <TabsList>
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="json">JSON Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Event</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Output Type</Label>
                <Select value={outputType} onValueChange={(v: any) => setOutputType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Media Slots */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Media Slots</CardTitle>
              <Button variant="outline" size="sm" onClick={addMediaSlot}><Plus className="mr-1 h-3 w-3" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {mediaSlots.map((slot, i) => (
                <div key={slot.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Slot {i + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeMediaSlot(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input value={slot.label} onChange={(e) => updateMediaSlot(i, "label", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="flex items-end gap-2">
                      <Checkbox checked={slot.required} onCheckedChange={(v) => updateMediaSlot(i, "required", !!v)} />
                      <Label className="text-xs">Required</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["x", "y", "width", "height"] as const).map((k) => (
                      <div key={k}>
                        <Label className="text-xs uppercase">{k}</Label>
                        <Input type="number" value={slot.position[k]} onChange={(e) => updateMediaPos(i, k, +e.target.value)} className="h-8 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {mediaSlots.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No media slots yet</p>}
            </CardContent>
          </Card>

          {/* Text Slots */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Text Slots</CardTitle>
              <Button variant="outline" size="sm" onClick={addTextSlot}><Plus className="mr-1 h-3 w-3" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {textSlots.map((slot, i) => (
                <div key={slot.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Slot {i + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeTextSlot(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input value={slot.label} onChange={(e) => updateTextSlot(i, "label", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Placeholder</Label>
                      <Input value={slot.placeholder} onChange={(e) => updateTextSlot(i, "placeholder", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Max Length</Label>
                      <Input type="number" value={slot.maxLength} onChange={(e) => updateTextSlot(i, "maxLength", +e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["x", "y", "width", "height"] as const).map((k) => (
                      <div key={k}>
                        <Label className="text-xs uppercase">{k}</Label>
                        <Input type="number" value={slot.position[k]} onChange={(e) => updateTextPos(i, k, +e.target.value)} className="h-8 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {textSlots.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No text slots yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Textarea
                value={templateJson}
                readOnly
                className="font-mono text-xs min-h-[400px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTemplateEditor;
