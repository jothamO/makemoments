import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const AdminEvents = () => {
  const events = useQuery(api.events.getAll);
  const templates = useQuery(api.templates.list);
  const celebrations = useQuery(api.celebrations.list);

  // Show loading state while initial data is fetching
  if (!events || !templates || !celebrations) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;
  }

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
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                      No events found. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((evt) => {
                    const eventTemplates = templates.filter(t => t.eventId === evt._id);
                    const eventCelebrations = celebrations.filter(c => c.eventId === evt._id);
                    const revenue = eventCelebrations
                      .filter(c => c.paymentStatus === "paid")
                      .reduce((acc, c) => acc + (c.totalPaid || 0), 0);

                    return (
                      <TableRow key={evt._id}>
                        <TableCell className="font-medium">{evt.name}</TableCell>
                        <TableCell>{new Date(evt.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={evt.status === "active" ? "default" : "secondary"}>
                            {evt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{eventTemplates.length}</TableCell>
                        <TableCell>{eventCelebrations.length}</TableCell>
                        <TableCell>₦{revenue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/events/${evt._id}/edit`}><Edit className="h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {events.length === 0 && <p className="text-center text-zinc-500 py-8">No events found.</p>}
        {events.map((evt) => {
          const eventTemplates = templates.filter(t => t.eventId === evt._id);
          return (
            <Card key={evt._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{evt.name}</h3>
                  <Badge variant={evt.status === "active" ? "default" : "secondary"}>{evt.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{new Date(evt.date).toLocaleDateString()} · {eventTemplates.length} templates</p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/admin/events/${evt._id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
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
