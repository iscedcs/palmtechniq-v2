"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  SettingsIcon,
  Bell,
  Shield,
  Globe,
  Palette,
  CreditCard,
  User,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Volume2,
  Eye,
  Lock,
  Trash2,
  Download,
} from "lucide-react";
import type { UserRole } from "@/types/user";
import { useAuthStore } from "@/lib/store/auth-store";
import { generateRandomAvatar } from "@/lib/utils";

export default function Settings() {
  const { user } = useAuthStore();
  const [userRole] = useState<UserRole>(user?.role || "STUDENT");
  const [userName] = useState(user?.firstName || "John Doe");
  const [userAvatar] = useState(user?.avatar || generateRandomAvatar());

  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    courseReminders: true,
    mentorshipAlerts: true,
    achievementNotifications: true,
    weeklyProgress: true,
    marketingEmails: false,
    soundEnabled: true,

    // Privacy
    publicProfile: true,
    showProgress: true,
    showAchievements: true,
    allowMessages: true,
    showOnlineStatus: true,

    // Appearance
    theme: "dark",
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",

    // Account
    twoFactorEnabled: false,
    sessionTimeout: 30,
    downloadData: false,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    console.log("Saving settings:", settings);
    // Here you would save to your backend
  };

  const handleExportData = () => {
    console.log("Exporting user data...");
    // Here you would trigger data export
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      console.log("Deleting account...");
      // Here you would handle account deletion
    }
  };

  const getRoleSpecificTabs = () => {
    const baseTabs = ["general", "notifications", "privacy", "appearance"];

    if (userRole === "TUTOR" || userRole === "ADMIN") {
      baseTabs.push("billing");
    }

    baseTabs.push("account");
    return baseTabs;
  };

  const tabs = getRoleSpecificTabs();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-white">Account</span>{" "}
              <span className="text-gradient">Settings</span>
            </h1>
            <p className="text-xl text-gray-300">
              Customize your learning experience
            </p>
          </motion.div>

          {/* Settings Tabs */}
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full text-foreground grid-cols-6 bg-white/10 border border-white/20 mb-8">
                <TabsTrigger
                  value="general"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-blue data-[state=active]:to-neon-purple data-[state=active]:text-white">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-green data-[state=active]:to-emerald-400 data-[state=active]:text-white">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-orange data-[state=active]:to-yellow-400 data-[state=active]:text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-purple data-[state=active]:to-pink-400 data-[state=active]:text-white">
                  <Palette className="w-4 h-4 mr-2" />
                  Appearance
                </TabsTrigger>
                {(userRole === "TUTOR" || userRole === "ADMIN") && (
                  <TabsTrigger
                    value="billing"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400 data-[state=active]:to-blue-400 data-[state=active]:text-white">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="account"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-400 data-[state=active]:to-pink-400 data-[state=active]:text-white">
                  <User className="w-4 h-4 mr-2" />
                  Account
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Language & Region
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Language</Label>
                        <Select
                          value={settings.language}
                          onValueChange={(value) =>
                            updateSetting("language", value)
                          }>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="pt">Portuguese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Timezone</Label>
                        <Select
                          value={settings.timezone}
                          onValueChange={(value) =>
                            updateSetting("timezone", value)
                          }>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">
                              Eastern Time
                            </SelectItem>
                            <SelectItem value="America/Chicago">
                              Central Time
                            </SelectItem>
                            <SelectItem value="America/Denver">
                              Mountain Time
                            </SelectItem>
                            <SelectItem value="America/Los_Angeles">
                              Pacific Time
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              London
                            </SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Date Format</Label>
                        <Select
                          value={settings.dateFormat}
                          onValueChange={(value) =>
                            updateSetting("dateFormat", value)
                          }>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">
                              MM/DD/YYYY
                            </SelectItem>
                            <SelectItem value="DD/MM/YYYY">
                              DD/MM/YYYY
                            </SelectItem>
                            <SelectItem value="YYYY-MM-DD">
                              YYYY-MM-DD
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Volume2 className="w-5 h-5" />
                        Audio & Video
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Sound Effects</Label>
                          <p className="text-sm text-gray-400">
                            Play sounds for notifications and interactions
                          </p>
                        </div>
                        <Switch
                          checked={settings.soundEnabled}
                          onCheckedChange={(checked) =>
                            updateSetting("soundEnabled", checked)
                          }
                        />
                      </div>

                      <Separator className="bg-white/10" />

                      <div className="space-y-2">
                        <Label className="text-white">Video Quality</Label>
                        <Select defaultValue="auto">
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="480p">480p</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        {
                          key: "emailNotifications",
                          label: "Email Notifications",
                          desc: "Receive notifications via email",
                        },
                        {
                          key: "courseReminders",
                          label: "Course Reminders",
                          desc: "Reminders about your courses",
                        },
                        {
                          key: "achievementNotifications",
                          label: "Achievement Notifications",
                          desc: "When you unlock achievements",
                        },
                        {
                          key: "weeklyProgress",
                          label: "Weekly Progress Reports",
                          desc: "Summary of your weekly progress",
                        },
                        {
                          key: "marketingEmails",
                          label: "Marketing Emails",
                          desc: "Promotional content and offers",
                        },
                      ].map((setting) => (
                        <div
                          key={setting.key}
                          className="flex items-center justify-between">
                          <div>
                            <Label className="text-white">
                              {setting.label}
                            </Label>
                            <p className="text-sm text-gray-400">
                              {setting.desc}
                            </p>
                          </div>
                          <Switch
                            checked={
                              settings[
                                setting.key as keyof typeof settings
                              ] as boolean
                            }
                            onCheckedChange={(checked) =>
                              updateSetting(setting.key, checked)
                            }
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Push Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        {
                          key: "pushNotifications",
                          label: "Push Notifications",
                          desc: "Browser and mobile notifications",
                        },
                        {
                          key: "mentorshipAlerts",
                          label: "Mentorship Alerts",
                          desc: "Updates about mentorship sessions",
                        },
                      ].map((setting) => (
                        <div
                          key={setting.key}
                          className="flex items-center justify-between">
                          <div>
                            <Label className="text-white">
                              {setting.label}
                            </Label>
                            <p className="text-sm text-gray-400">
                              {setting.desc}
                            </p>
                          </div>
                          <Switch
                            checked={
                              settings[
                                setting.key as keyof typeof settings
                              ] as boolean
                            }
                            onCheckedChange={(checked) =>
                              updateSetting(setting.key, checked)
                            }
                          />
                        </div>
                      ))}

                      <div className="p-4 bg-neon-blue/10 border border-neon-blue/20 rounded-lg">
                        <h4 className="text-neon-blue font-semibold mb-2">
                          Notification Permissions
                        </h4>
                        <p className="text-sm text-gray-300 mb-3">
                          Enable browser notifications to receive real-time
                          updates.
                        </p>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-neon-blue to-neon-purple"
                          onClick={() => {
                            if ("Notification" in window) {
                              Notification.requestPermission();
                            }
                          }}>
                          Enable Notifications
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Privacy Settings */}
              <TabsContent value="privacy" className="space-y-6">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Profile Visibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        key: "publicProfile",
                        label: "Public Profile",
                        desc: "Make your profile visible to other users",
                      },
                      {
                        key: "showProgress",
                        label: "Show Learning Progress",
                        desc: "Display your course progress publicly",
                      },
                      {
                        key: "showAchievements",
                        label: "Show Achievements",
                        desc: "Display your achievements and badges",
                      },
                      {
                        key: "allowMessages",
                        label: "Allow Messages",
                        desc: "Let other users send you messages",
                      },
                      {
                        key: "showOnlineStatus",
                        label: "Show Online Status",
                        desc: "Display when you're online",
                      },
                    ].map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">{setting.label}</Label>
                          <p className="text-sm text-gray-400">
                            {setting.desc}
                          </p>
                        </div>
                        <Switch
                          checked={
                            settings[
                              setting.key as keyof typeof settings
                            ] as boolean
                          }
                          onCheckedChange={(checked) =>
                            updateSetting(setting.key, checked)
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Monitor className="w-5 h-5" />
                        Theme
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "light", label: "Light", icon: Sun },
                          { value: "dark", label: "Dark", icon: Moon },
                          { value: "auto", label: "Auto", icon: Monitor },
                        ].map((theme) => (
                          <div
                            key={theme.value}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ₦{
                              settings.theme === theme.value
                                ? "border-neon-blue bg-neon-blue/10"
                                : "border-white/20 hover:border-white/40"
                            }`}
                            onClick={() => updateSetting("theme", theme.value)}>
                            <theme.icon className="w-6 h-6 text-white mx-auto mb-2" />
                            <p className="text-center text-white text-sm">
                              {theme.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Display Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Font Size</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Animation Speed</Label>
                        <Select defaultValue="normal">
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Slow</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                            <SelectItem value="none">No Animations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Billing Settings (Tutor/Admin only) */}
              {(userRole === "TUTOR" || userRole === "ADMIN") && (
                <TabsContent value="billing" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="glass-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Payment Methods
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">
                              •••• •••• •••• 4242
                            </span>
                            <span className="text-sm text-gray-400">
                              Expires 12/25
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Primary payment method
                          </p>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-neon-blue to-neon-purple">
                          Add Payment Method
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="glass-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">
                          Billing History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {[
                            {
                              date: "Dec 1, 2023",
                              amount: "₦29.99",
                              status: "Paid",
                            },
                            {
                              date: "Nov 1, 2023",
                              amount: "₦29.99",
                              status: "Paid",
                            },
                            {
                              date: "Oct 1, 2023",
                              amount: "₦29.99",
                              status: "Paid",
                            },
                          ].map((invoice, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-white/5 rounded">
                              <div>
                                <p className="text-white font-medium">
                                  {invoice.amount}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {invoice.date}
                                </p>
                              </div>
                              <span className="text-green-400 text-sm">
                                {invoice.status}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent">
                          View All Invoices
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

              {/* Account Settings */}
              <TabsContent value="account" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">
                            Two-Factor Authentication
                          </Label>
                          <p className="text-sm text-gray-400">
                            Add an extra layer of security
                          </p>
                        </div>
                        <Switch
                          checked={settings.twoFactorEnabled}
                          onCheckedChange={(checked) =>
                            updateSetting("twoFactorEnabled", checked)
                          }
                        />
                      </div>

                      <Separator className="bg-white/10" />

                      <div className="space-y-2">
                        <Label className="text-white">Session Timeout</Label>
                        <Select
                          value={settings.sessionTimeout.toString()}
                          onValueChange={(value) =>
                            updateSetting(
                              "sessionTimeout",
                              Number.parseInt(value),
                            )
                          }>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-neon-orange to-yellow-400">
                        Change Password
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Data & Privacy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        onClick={handleExportData}
                        className="w-full bg-gradient-to-r from-neon-blue to-neon-purple">
                        <Download className="w-4 h-4 mr-2" />
                        Export My Data
                      </Button>

                      <Separator className="bg-white/10" />

                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <h4 className="text-red-400 font-semibold mb-2">
                          Danger Zone
                        </h4>
                        <p className="text-sm text-gray-300 mb-4">
                          Once you delete your account, there is no going back.
                          Please be certain.
                        </p>
                        <Button
                          onClick={handleDeleteAccount}
                          variant="destructive"
                          className="w-full bg-red-600 hover:bg-red-700">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end pt-8 border-t border-white/10">
              <Button
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-neon-green to-emerald-400 px-8">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
