import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllTemplates, getAllEvents, getAllSales } from "@/data/data-service";
import { Plus, Edit } from "lucide-react";
import { useState } from "react";

const AdminTemplates = () => {
  const templates = getAllTemplates();
  const events = getAllEvents();
  const sales = getAllSales();
  const [eventFilter, setEventFilter] = useState("all");

  const filtered = eventFilter === "all" ? templates : templates.filter((t) => t.eventId === eventFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Button asChild>
          <Link to="/admin/templates/new"><Plus className="mr-2 h-4 w-4" /> Upload Template</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by event" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((tpl) => {
          const event = events.find((e) => e.id === tpl.eventId);
          const revenue = sales.filter((s) => s.templateId === tpl.id).reduce((a, s) => a + s.amount, 0);
          return (
            <Card key={tpl.id} className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
                {tpl.name.includes("Magazine") ? "📰" : tpl.name.includes("Collage") ? "🖼️" : "💌"}
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold text-sm">{tpl.name}</h3>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{event?.name}</Badge>
                  <Badge variant="outline" className="text-[10px]">{tpl.outputType}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{tpl.popularity} uses · ₦{revenue.toLocaleString()}</p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/admin/templates/${tpl.id}/edit`}><Edit className="mr-2 h-3 w-3" /> Edit</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTemplates;
