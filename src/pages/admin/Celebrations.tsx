import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllCelebrations, getAllEvents, getTemplateById, getEventById } from "@/data/data-service";
import { Eye, Trash2, ExternalLink, Search } from "lucide-react";
import { Link } from "react-router-dom";

const AdminCelebrations = () => {
  const celebrations = getAllCelebrations();
  const events = getAllEvents();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  const filtered = celebrations.filter((c) => {
    const matchesSearch = !search || c.slug.includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchesEvent = eventFilter === "all" || c.eventId === eventFilter;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Celebrations</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Events" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const template = getTemplateById(c.templateId);
          const event = getEventById(c.eventId);
          return (
            <Card key={c.id} className="overflow-hidden">
              <div
                className="aspect-video flex items-center justify-center text-white text-sm"
                style={{ background: event ? `linear-gradient(135deg, ${event.theme.bgGradientStart}, ${event.theme.bgGradientEnd})` : undefined }}
              >
                {template?.name ?? "Card"}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{c.slug}</span>
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Eye className="h-3 w-3" /> {c.views}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.email}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{event?.name}</Badge>
                  <Badge variant="outline" className="text-[10px]">₦{c.totalPaid.toLocaleString()}</Badge>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/${c.slug}`}><ExternalLink className="mr-1 h-3 w-3" /> View</Link>
                  </Button>
                  <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-10">No celebrations found.</p>
      )}
    </div>
  );
};

export default AdminCelebrations;
