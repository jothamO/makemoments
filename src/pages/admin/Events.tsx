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

import { Drawer } from "vaul";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { MoreVertical, ExternalLink as ExternalLinkIcon } from "lucide-react";

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
  if (events === undefined || celebrations === undefined) {
    return <GlobalLoader transparent />;
  }

  const monthCelebrations = celebrations.filter(c => isSameMonth(new Date(c.createdAt), currentMonth));

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
              <Drawer.Root key={evt._id}>
                <Drawer.Trigger asChild>
                  <Card className="relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:bg-zinc-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-zinc-900">{evt.name}</h3>
                        <Badge variant={evt.status === "active" ? "default" : "secondary"} className="text-[10px] h-5 px-1.5 uppercase font-bold tracking-wider">
                          {evt.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2 text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-sm border-zinc-200">T{evt.tier || 4}</Badge>
                        <span className="capitalize">{evt.kind}</span> • <span>{new Date(evt.date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
                  <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-auto mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none">
                    <div className="p-4 bg-white rounded-t-[10px] flex-1">
                      <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-8" />
                      <div className="max-w-md mx-auto">
                        <Drawer.Title className="font-bold mb-1 text-zinc-900 flex items-center gap-2">
                          {evt.name}
                          <Badge variant={evt.status === "active" ? "default" : "secondary"} className="text-[10px] h-5 px-1.5">{evt.status}</Badge>
                        </Drawer.Title>
                        <Drawer.Description className="text-zinc-500 text-sm mb-6">
                          Manage event details, assets, and scheduling.
                        </Drawer.Description>

                        <div className="grid gap-2 mb-8">
                          <Button variant="outline" className="w-full justify-start h-12 text-zinc-700 font-medium px-4" asChild>
                            <Link to={`/admin/events/${evt._id}/edit`}>
                              <Edit className="mr-3 h-4 w-4 text-zinc-400" /> Edit Event Details
                            </Link>
                          </Button>
                          <Button variant="outline" className="w-full justify-start h-12 text-zinc-700 font-medium px-4" asChild>
                            <Link to={`/events/${evt._id}`}>
                              <ExternalLinkIcon className="mr-3 h-4 w-4 text-zinc-400" /> View Public Page
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/5 font-medium px-4">
                                <Trash2 className="mr-3 h-4 w-4" /> Delete Event
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[calc(100%-32px)] rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{evt.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove the event and all linked data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row gap-2 mt-4">
                                <AlertDialogCancel className="flex-1 mt-0 rounded-lg">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(evt._id)} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        <Drawer.Close asChild>
                          <Button variant="ghost" className="w-full h-12 text-zinc-500 font-bold mb-2">
                            Close
                          </Button>
                        </Drawer.Close>
                      </div>
                    </div>
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
            {/* Calendar Column (Desktop) */}
            <div className="hidden lg:block">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 px-6 pt-6">
                  <CardTitle className="text-base font-bold">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 border-t border-zinc-100">
                  <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                      <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-r border-zinc-100 last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 auto-rows-[120px]">
                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="border-r border-b border-zinc-100 bg-zinc-50/30 p-2" />
                    ))}
                    {eachDayOfInterval({
                      start: startOfMonth(currentMonth),
                      end: endOfMonth(currentMonth)
                    }).map(day => {
                      const dayEvents = events.filter(e => {
                        const start = startOfDay(e.launchDate);
                        const end = endOfDay(e.endDate || e.date + 86400000);
                        return isWithinInterval(day, { start, end });
                      });

                      return (
                        <div key={day.toString()} className={cn(
                          "border-r border-b border-zinc-100 p-1 overflow-hidden relative group transition-colors",
                          !isSameMonth(day, currentMonth) && "bg-zinc-50/30",
                          isSameDay(day, new Date()) && "bg-indigo-50/50"
                        )}>
                          <span className={cn(
                            "text-[10px] font-bold ml-1 px-1 rounded",
                            isSameDay(day, new Date()) ? "bg-indigo-600 text-white" : "text-zinc-400"
                          )}>
                            {format(day, "d")}
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {dayEvents.slice(0, 4).map(e => (
                              <div
                                key={e._id}
                                className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded-sm truncate border-l-2 font-medium",
                                  e.tier === 1 ? "bg-pink-100 text-pink-700 border-pink-500" :
                                    e.tier === 2 ? "bg-indigo-100 text-indigo-700 border-indigo-500" :
                                      e.tier === 3 ? "bg-amber-100 text-amber-700 border-amber-500" :
                                        "bg-zinc-100 text-zinc-700 border-zinc-400"
                                )}
                              >
                                {e.name}
                              </div>
                            ))}
                            {dayEvents.length > 4 && (
                              <div className="text-[8px] text-zinc-400 pl-1 font-bold">
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
            </div>

            {/* Agenda/Schedule Column (Mobile View) */}
            <div className="lg:hidden space-y-6">
              <div className="flex items-center justify-between bg-zinc-100/50 p-2 rounded-xl border border-zinc-200">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-bold text-zinc-900">{format(currentMonth, "MMMM yyyy")}</div>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {events
                  .filter(e => isSameMonth(new Date(e.launchDate), currentMonth) || isSameMonth(new Date(e.endDate || e.date), currentMonth))
                  .sort((a, b) => a.date - b.date)
                  .map(evt => (
                    <Card key={evt._id} className="relative overflow-hidden group">
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1.5",
                        evt.tier === 1 ? "bg-pink-500" :
                          evt.tier === 2 ? "bg-indigo-500" :
                            evt.tier === 3 ? "bg-amber-500" :
                              "bg-zinc-400"
                      )} />
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{format(evt.date, "MMM d")}</span>
                            <Badge variant="outline" className="text-[8px] h-4 px-1 border-zinc-200">T{evt.tier || 4}</Badge>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-900 truncate">{evt.name}</h4>
                          <p className="text-[10px] text-zinc-500 mt-1 capitalize">{evt.kind} Event</p>
                        </div>
                        <Badge variant={evt.status === "active" ? "default" : "secondary"} className="text-[9px] h-5 px-1.5 uppercase font-bold tracking-wider">
                          {evt.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300" asChild>
                          <Link to={`/admin/events/${evt._id}/edit`}><ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                {events.filter(e => isSameMonth(new Date(e.date), currentMonth)).length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-2xl">
                    <Calendar className="h-8 w-8 mx-auto mb-3 text-zinc-200" />
                    <p className="text-xs text-zinc-400 font-medium">No events scheduled for this month</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Overview Column (Desktop Only) */}
            <div className="hidden lg:block space-y-4">
              <Card className="border-zinc-200">
                <CardHeader className="pb-3 px-5 pt-5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-400">Month Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  {events
                    .filter(e => isSameMonth(new Date(e.date), currentMonth))
                    .sort((a, b) => a.date - b.date)
                    .map(evt => (
                      <div key={evt._id} className="flex items-start gap-3 group relative cursor-pointer hover:bg-zinc-50 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-zinc-100">
                        <div className={cn(
                          "mt-1 w-2 h-2 rounded-full shrink-0 shadow-sm",
                          evt.tier === 1 ? "bg-pink-500" :
                            evt.tier === 2 ? "bg-indigo-500" :
                              evt.tier === 3 ? "bg-amber-500" :
                                "bg-zinc-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold leading-none mb-1 text-zinc-900 truncate">{evt.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
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

              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tier Legend</h4>
                <div className="space-y-2 text-zinc-700">
                  <div className="flex items-center gap-2 text-[10px] font-medium">
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm" /> <span>Tier 1: Spotlight Peak</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-medium">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" /> <span>Tier 2: Major Event</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-medium">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" /> <span>Tier 3: Contextual</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-medium">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 shadow-sm" /> <span>Tier 4: Minor/Evergreen</span>
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
