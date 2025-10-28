import { useEffect, useState } from "react";
import { useBackend } from "../hooks/useBackend";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProfilePage() {
  const backend = useBackend();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "",
    occupation: "",
    sleepHours: "22:00 - 06:00",
    productiveHours: [] as string[],
    customHours: "",
    focusPreference: "balance",
    alertFrequency: "normal",
    allocationStrategy: "fill_first_day",
  });

  useEffect(() => {
    backend.profile.get()
      .then((data) => {
        setProfile({
          name: data.name,
          occupation: data.occupation || "",
          sleepHours: data.sleepHours,
          productiveHours: data.productiveHours,
          customHours: data.customHours || "",
          focusPreference: data.focusPreference,
          alertFrequency: data.alertFrequency,
          allocationStrategy: data.allocationStrategy,
        });
      })
      .catch(console.error);
  }, [backend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await backend.profile.update({
        name: profile.name,
        occupation: profile.occupation,
        sleepHours: profile.sleepHours,
        productiveHours: profile.productiveHours as any,
        customHours: profile.customHours,
        focusPreference: profile.focusPreference as any,
        alertFrequency: profile.alertFrequency as any,
        allocationStrategy: profile.allocationStrategy as any,
      });

      toast({ title: "Profile updated!", description: "Your settings have been saved" });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const toggleProductiveHour = (hour: string) => {
    setProfile({
      ...profile,
      productiveHours: profile.productiveHours.includes(hour)
        ? profile.productiveHours.filter((h) => h !== hour)
        : [...profile.productiveHours, hour],
    });
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal preferences and work habits</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={profile.occupation}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sleepHours">Sleep Hours (e.g., "22:00 - 06:00")</Label>
                <Input
                  id="sleepHours"
                  value={profile.sleepHours}
                  onChange={(e) => setProfile({ ...profile, sleepHours: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Productive Hours</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="morning"
                      checked={profile.productiveHours.includes("morning")}
                      onCheckedChange={() => toggleProductiveHour("morning")}
                    />
                    <label htmlFor="morning" className="text-sm">
                      Morning (6:00 - 12:00)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="afternoon"
                      checked={profile.productiveHours.includes("afternoon")}
                      onCheckedChange={() => toggleProductiveHour("afternoon")}
                    />
                    <label htmlFor="afternoon" className="text-sm">
                      Afternoon (12:00 - 18:00)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="evening"
                      checked={profile.productiveHours.includes("evening")}
                      onCheckedChange={() => toggleProductiveHour("evening")}
                    />
                    <label htmlFor="evening" className="text-sm">
                      Evening (18:00 - 23:59)
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focusPreference">Focus Preference</Label>
                <Select
                  value={profile.focusPreference}
                  onValueChange={(value) => setProfile({ ...profile, focusPreference: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intense">Intense Focus</SelectItem>
                    <SelectItem value="balance">Balanced</SelectItem>
                    <SelectItem value="light">Light Routine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertFrequency">Alert Frequency</Label>
                <Select
                  value={profile.alertFrequency}
                  onValueChange={(value) => setProfile({ ...profile, alertFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="intense">Intense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocationStrategy">Allocation Strategy</Label>
                <Select
                  value={profile.allocationStrategy}
                  onValueChange={(value) => setProfile({ ...profile, allocationStrategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fill_first_day">Fill First Day</SelectItem>
                    <SelectItem value="one_task_per_day">One Task Per Day</SelectItem>
                    <SelectItem value="distribute_evenly">Distribute Evenly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </div>
    </Layout>
  );
}
