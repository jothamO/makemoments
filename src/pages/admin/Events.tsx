import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import {
  Plus, Edit, Loader2, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, LayoutList, Calendar, Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AdminEvents = () => {
  const events = useQuery(api.events.getAll);
  const celebrations = useQuery(api.celebrations.list);
  const removeEvent = useMutation(api.events.remove);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDelete = async (id: any) => {
    try {
      await removeEvent({ id });
      toast.success("Event deleted successfully");
    } catch (error) {
      toast.error("Failed to delete event");
      console.error(error);
    }
  };

  // Show loading state while initial data is fetching
  if (!events || !celebrations) {
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

      <Tabs defaultValue="management" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6 mt-6">
          {/* Desktop table */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                          No events found. Create your first one!
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((evt) => (
                        <TableRow key={evt._id}>
                          <TableCell><Badge variant="outline">T{evt.tier || 4}</Badge></TableCell>
                          <TableCell className="font-medium">{evt.name}</TableCell>
                          <TableCell className="capitalize">{evt.kind || "one-time"}</TableCell>
                          <TableCell>{new Date(evt.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={evt.status === "active" ? "default" : "secondary"}>
                              {evt.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/admin/events/${evt._id}/edit`}><Edit className="h-4 w-4" /></Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will delete the event "{evt.name}" and all associated templates. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(evt._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {events.length === 0 && <p className="text-center text-zinc-500 py-8">No events found.</p>}
            {events.map((evt) => (
              <Card key={evt._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{evt.name}</h3>
                    <Badge variant={evt.status === "active" ? "default" : "secondary"}>{evt.status}</Badge>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                    <span>T{evt.tier || 4}</span> • <span className="capitalize">{evt.kind}</span> • <span>{new Date(evt.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/admin/events/${evt._id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete the event "{evt.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(evt._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
            {/* Calendar Column */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <CardTitle className="text-base font-semibold">
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 border-t">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-b bg-zinc-50/50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-r last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-[120px]">
                  {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-r border-b bg-zinc-50/30 p-2" />
                  ))}
                  {eachDayOfInterval({
                    start: startOfMonth(currentMonth),
                    end: endOfMonth(currentMonth)
                  }).map(day => {
                    const dayEvents = events.filter(e => {
                      const start = startOfDay(e.launchDate);
                      const end = endOfDay(e.endDate || e.date + 86400000); // Fallback for Evergreen
                      return isWithinInterval(day, { start, end });
                    });

                    return (
                      <div key={day.toString()} className={cn(
                        "border-r border-b p-1 overflow-hidden relative group",
                        !isSameMonth(day, currentMonth) && "bg-zinc-50/30",
                        isSameDay(day, new Date()) && "bg-blue-50/30"
                      )}>
                        <span className={cn(
                          "text-[10px] font-medium ml-1",
                          isSameDay(day, new Date()) ? "bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full" : "text-zinc-500"
                        )}>
                          {format(day, "d")}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 4).map(e => (
                            <div
                              key={e._id}
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-sm truncate border-l-2",
                                e.tier === 1 ? "bg-pink-100 text-pink-700 border-pink-500" :
                                  e.tier === 2 ? "bg-blue-100 text-blue-700 border-blue-500" :
                                    e.tier === 3 ? "bg-amber-100 text-amber-700 border-amber-500" :
                                      "bg-zinc-100 text-zinc-700 border-zinc-400"
                              )}
                            >
                              {e.name}
                            </div>
                          ))}
                          {dayEvents.length > 4 && (
                            <div className="text-[8px] text-zinc-400 pl-1 font-medium">
                              +{dayEvents.length - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Column */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Month Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events
                    .filter(e => isSameMonth(new Date(e.date), currentMonth))
                    .sort((a, b) => a.date - b.date)
                    .map(evt => (
                      <div key={evt._id} className="flex items-start gap-3 group relative cursor-pointer hover:bg-zinc-50 p-2 -mx-2 rounded-lg transition-colors">
                        <div className={cn(
                          "mt-1 w-2 h-2 rounded-full shrink-0",
                          evt.tier === 1 ? "bg-pink-500" :
                            evt.tier === 2 ? "bg-blue-500" :
                              evt.tier === 3 ? "bg-amber-500" :
                                "bg-zinc-400"
                        )} />
                        <div>
                          <p className="text-xs font-bold leading-none mb-1">{evt.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(evt.date, "MMM d")} • {evt.kind}
                          </p>
                        </div>
                        <Link to={`/admin/events/${evt._id}/edit`} className="absolute inset-0 opacity-0" />
                      </div>
                    ))}
                  {events.filter(e => isSameMonth(new Date(e.date), currentMonth)).length === 0 && (
                    <p className="text-xs text-zinc-400 italic text-center py-4">No events this month</p>
                  )}
                </CardContent>
              </Card>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tier Legend</h4>
                <div className="space-y-1.5 text-zinc-700">
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-pink-500" /> <span>Tier 1: Spotlight Peak</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> <span>Tier 2: Major Event</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> <span>Tier 3: Contextual</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-zinc-400" /> <span>Tier 4: Minor/Evergreen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEvents;
