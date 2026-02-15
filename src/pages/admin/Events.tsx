import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllEvents, getTemplatesByEvent, getAllCelebrations, getAllSales } from "@/data/data-service";
import { Plus, Edit } from "lucide-react";

const AdminEvents = () => {
  const events = getAllEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button asChild>
          <Link to="/admin/events/new"><Plus className="mr-2 h-4 w-4" /> Create Event</Link>
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Templates</TableHead>
                  <TableHead>Celebrations</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => {
                  const templates = getTemplatesByEvent(evt.id);
                  const celebrations = getAllCelebrations().filter((c) => c.eventId === evt.id);
                  const revenue = getAllSales().filter((s) => s.eventId === evt.id).reduce((a, s) => a + s.amount, 0);
                  return (
                    <TableRow key={evt.id}>
                      <TableCell className="font-medium">{evt.name}</TableCell>
                      <TableCell>{new Date(evt.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={evt.status === "active" ? "default" : "secondary"}>
                          {evt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{templates.length}</TableCell>
                      <TableCell>{celebrations.length}</TableCell>
                      <TableCell>₦{revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/events/${evt.id}/edit`}><Edit className="h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {events.map((evt) => {
          const templates = getTemplatesByEvent(evt.id);
          return (
            <Card key={evt.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{evt.name}</h3>
                  <Badge variant={evt.status === "active" ? "default" : "secondary"}>{evt.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{new Date(evt.date).toLocaleDateString()} · {templates.length} templates</p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/admin/events/${evt.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminEvents;
