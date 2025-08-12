import React, { useEffect, useState } from "react";
import {
  Video as VideoIcon,
  Play,
  X,
  CheckCircle,
  FileVideo,
  Sparkles,
  Eye,
  BarChart3,
  Heart,
  Share2,
  Wand2,
  Youtube,
  Camera,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { assembleSlideshowVideo } from "@/utils/assembleVideo";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

// Admin Video Manager with mock creation flow and content library
export type CompanyData = { name?: string };
export default function VideoManager({ companyData }: { companyData?: CompanyData }) {
  const [videoModal, setVideoModal] = useState(false);
  const [selectedVideoType, setSelectedVideoType] = useState<string>("intro");
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [videoCreationStep, setVideoCreationStep] = useState(0);
  const [createdVideos, setCreatedVideos] = useState<any[]>([]);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [videoAnalytics, setVideoAnalytics] = useState<any | null>(null);

  const { toast } = useToast();
  const { user } = useSupabaseUser();

  const videoTypes = [
    { id: "intro", name: "Company Introduction", description: "Professional company overview video", duration: "60-90s", icon: Camera },
    { id: "product", name: "Product Showcase", description: "Highlight products/services", duration: "90-120s", icon: Sparkles },
    { id: "educational", name: "Educational Content", description: "Tips and insights", duration: "120-180s", icon: Play },
    { id: "testimonial", name: "Testimonial Style", description: "Customer success story", duration: "60-90s", icon: Heart },
  ];

  const creationSteps = [
    "Generating Script",
    "Creating Visual Frames",
    "Generating Voiceover",
    "Assembling Video",
    "Uploading Video",
  ];

  useEffect(() => {
    if (createdVideos.length > 0) {
      setVideoAnalytics({
        totalVideos: createdVideos.length,
        totalViews: 2547,
        totalWatchTime: "45.2 hours",
        avgEngagement: "8.4%",
      });
    }
  }, [createdVideos]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, type, duration_seconds, created_at, video_url, thumbnail_url, status")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to fetch videos", error);
        toast({ title: "Failed to load videos", description: error.message });
        return;
      }
      const mapped = (data || []).map((v: any) => ({
        id: v.id,
        type: v.type,
        title: v.title,
        duration: v.duration_seconds ?? 0,
        thumbnail: v.thumbnail_url || "/placeholder.svg",
        youtubeUrl: v.video_url || "#",
        createdAt: v.created_at,
        status: v.status,
        views: 0,
        likes: 0,
        comments: 0,
      }));
      setCreatedVideos(mapped);
      if (mapped.length > 0) {
        setVideoAnalytics({
          totalVideos: mapped.length,
          totalViews: 2547,
          totalWatchTime: "45.2 hours",
          avgEngagement: "8.4%",
        });
      }
    })();
  }, [user]);

  const handleCreateVideo = async (videoType: string, options?: any) => {
    setSelectedVideoType(videoType);
    setIsCreatingVideo(true);
    setVideoCreationStep(0);

    try {
      // 1) Generate script via Edge Function
      const { data: created, error: createErr } = await supabase.functions.invoke('video-create', {
        body: {
          companyName: companyData?.name,
          type: videoType,
          style: options?.style ?? 'professional',
        },
      });
      if (createErr) throw createErr;

      const videoId = created?.videoId as string;
      if (!videoId) throw new Error("Missing video id from creation step");

      setVideoCreationStep(1);
      toast({ title: 'Script generated', description: 'Starting scenes and voiceover...' });

      // 2) Scenes + TTS in parallel
      const scenesPromise = supabase.functions.invoke('scenes-generate', {
        body: { videoId, width: 1280, height: 720, model: 'runware:100@1' },
      });
      const ttsPromise = supabase.functions.invoke('tts-elevenlabs', {
        body: { videoId, voiceId: options?.voiceId, modelId: 'eleven_multilingual_v2' },
      });

      const [{ data: scenesData, error: scenesErr }, { data: ttsData, error: ttsErr }] = await Promise.all([scenesPromise, ttsPromise]);
      if (scenesErr) throw scenesErr;
      if (ttsErr) throw ttsErr;

      const scenePaths: string[] = scenesData?.scenePaths || [];
      const audioPath: string = ttsData?.audioPath;
      if (!scenePaths.length) throw new Error("No scene images generated");
      if (!audioPath) throw new Error("No audio generated");

      // Resolve public URLs for assets
      const imageUrls = scenePaths
        .map((p: string) => supabase.storage.from('videos').getPublicUrl(p).data.publicUrl)
        .filter(Boolean);
      const audioUrl = supabase.storage.from('videos').getPublicUrl(audioPath).data.publicUrl;
      if (!audioUrl || imageUrls.length !== scenePaths.length) {
        throw new Error('Failed to resolve public URLs for assets');
      }

      setVideoCreationStep(3); // assembling

      // 3) Assemble client-side
      const videoBlob = await assembleSlideshowVideo({ imageUrls, audioUrl, width: 1280, height: 720, fps: 30 });

      setVideoCreationStep(4); // uploading

      // 4) Upload video and update DB
      const videoPath = `videos/${user?.id || 'anon'}/${videoId}/video.webm`;
      const { error: uploadErr } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoBlob, { contentType: 'video/webm', upsert: true });
      if (uploadErr) throw uploadErr;

      const publicUrl = supabase.storage.from('videos').getPublicUrl(videoPath).data.publicUrl;

      const { error: updateErr } = await supabase
        .from('videos')
        .update({ video_url: publicUrl, size_bytes: videoBlob.size, status: 'ready' })
        .eq('id', videoId);
      if (updateErr) throw updateErr;

      toast({ title: 'Video ready', description: 'Your video has been generated and uploaded.' });

      // Refresh library
      if (user) {
        const { data, error } = await supabase
          .from('videos')
          .select('id, title, type, duration_seconds, created_at, video_url, thumbnail_url, status')
          .order('created_at', { ascending: false });
        if (!error && data) {
          const mapped = data.map((v: any) => ({
            id: v.id,
            type: v.type,
            title: v.title,
            duration: v.duration_seconds ?? 0,
            thumbnail: v.thumbnail_url || '/placeholder.svg',
            youtubeUrl: v.video_url || '#',
            createdAt: v.created_at,
            status: v.status,
            views: 0,
            likes: 0,
            comments: 0,
          }));
          setCreatedVideos(mapped);
        }
      }

      setIsCreatingVideo(false);
      setVideoModal(false);
      setVideoCreationStep(0);
    } catch (e: any) {
      console.error('Video pipeline failed', e);
      toast({ title: 'Video creation failed', description: e?.message || 'Please try again.' });
      setIsCreatingVideo(false);
      // keep modal open for retry
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Content & Video Publishing</h2>
          <p className="text-sm text-muted-foreground mt-1">Create videos and publish across platforms</p>
        </div>
        <div className="flex items-center gap-2">
          {companyData && (
            <button
              onClick={() => setVideoModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
            >
              <VideoIcon className="h-4 w-4" />
              Create Video
            </button>
          )}
        </div>
      </div>

      {videoAnalytics && (
        <div className="rounded-lg bg-primary/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">YouTube Performance</h3>
              <div className="mt-2 grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Total Videos</div>
                  <div className="text-lg font-semibold">{videoAnalytics.totalVideos}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Views</div>
                  <div className="text-lg font-semibold">{videoAnalytics.totalViews.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Watch Time</div>
                  <div className="text-lg font-semibold">{videoAnalytics.totalWatchTime}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg Engagement</div>
                  <div className="text-lg font-semibold">{videoAnalytics.avgEngagement}</div>
                </div>
              </div>
            </div>
            <Youtube className="h-6 w-6 opacity-70" />
          </div>
        </div>
      )}

      {createdVideos.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h3 className="text-sm font-semibold">Video Library</h3>
            <p className="text-xs text-muted-foreground mt-1">Your AI-generated videos</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {createdVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </div>
      )}

      {videoModal && (
        <VideoCreationModal
          companyData={companyData}
          videoTypes={videoTypes}
          isCreating={isCreatingVideo}
          creationStep={videoCreationStep}
          creationSteps={creationSteps}
          onCreateVideo={handleCreateVideo}
          onClose={() => setVideoModal(false)}
          selectedType={selectedVideoType}
          setSelectedType={setSelectedVideoType}
        />
      )}

      <EnhancedContentLibrary
        generatedContent={generatedContent}
        setGeneratedContent={setGeneratedContent}
      />
    </div>
  );
}

function VideoCreationModal({
  companyData,
  videoTypes,
  isCreating,
  creationStep,
  creationSteps,
  onCreateVideo,
  onClose,
  selectedType,
  setSelectedType,
}: any) {
  const [customizations, setCustomizations] = useState({
    style: "professional",
    voiceGender: "female",
    backgroundMusic: true,
    brandColors: true,
  });

  if (!companyData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border bg-background shadow">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Create AI Video</h3>
              <p className="mt-1 text-sm text-muted-foreground">Generate a professional video for {companyData.name}</p>
            </div>
            {!isCreating && (
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {isCreating ? (
            <VideoCreationProgress step={creationStep} steps={creationSteps} selectedType={selectedType} videoTypes={videoTypes} />
          ) : (
            <>
              <div className="mb-8">
                <h4 className="mb-4 font-semibold">Choose Video Type</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {videoTypes.map((type: any) => {
                    const IconComponent = type.icon;
                    const active = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`rounded-lg border-2 p-4 text-left transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-muted"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`rounded-lg p-2 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">{type.name}</h5>
                            <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
                            <p className="mt-2 text-xs text-muted-foreground">Duration: {type.duration}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="mb-4 font-semibold">Customization Options</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Video Style</label>
                    <select
                      value={customizations.style}
                      onChange={(e) => setCustomizations({ ...customizations, style: e.target.value })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="professional">Professional</option>
                      <option value="modern">Modern & Dynamic</option>
                      <option value="minimalist">Clean & Minimalist</option>
                      <option value="creative">Creative & Artistic</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Narrator Voice</label>
                    <select
                      value={customizations.voiceGender}
                      onChange={(e) => setCustomizations({ ...customizations, voiceGender: e.target.value })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="female">Female (Professional)</option>
                      <option value="male">Male (Authoritative)</option>
                      <option value="neutral">AI Voice (Neutral)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={customizations.backgroundMusic}
                      onChange={(e) => setCustomizations({ ...customizations, backgroundMusic: e.target.checked })}
                    />
                    Include background music
                  </label>

                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={customizations.brandColors}
                      onChange={(e) => setCustomizations({ ...customizations, brandColors: e.target.checked })}
                    />
                    Use company brand colors
                  </label>
                </div>
              </div>

              <div className="mb-8 rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-medium">Video Preview</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong>Company:</strong> {companyData.name}
                  </p>
                  <p>
                    <strong>Type:</strong> {videoTypes.find((v: any) => v.id === selectedType)?.name}
                  </p>
                  <p>
                    <strong>Style:</strong> {customizations.style}
                  </p>
                  <p>
                    <strong>Estimated Duration:</strong> {videoTypes.find((v: any) => v.id === selectedType)?.duration}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {!isCreating && (
          <div className="flex items-center justify-end gap-2 border-t p-6">
            <button onClick={onClose} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button onClick={() => onCreateVideo(selectedType, customizations)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
              <Wand2 className="h-4 w-4" /> Create Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCreationProgress({ step, steps, selectedType, videoTypes }: any) {
  const currentVideoType = videoTypes.find((v: any) => v.id === selectedType);
  return (
    <div className="py-8 text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <VideoIcon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Creating Your Video</h3>
        <p className="text-sm text-muted-foreground">AI is generating a {currentVideoType?.name?.toLowerCase()} for your company</p>
      </div>

      <div className="mx-auto mb-8 max-w-md">
        <div className="space-y-4">
          {steps.map((stepName: string, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  index < step ? "bg-green-500 text-white" : index === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {index < step ? (
                  <CheckCircle className="h-4 w-4" />
                ) : index === step ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`text-sm ${index <= step ? "font-medium" : "text-muted-foreground"}`}>{stepName}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">This usually takes 2-3 minutes. Please don't close this window.</div>
    </div>
  );
}

function VideoCard({ video }: any) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative">
        <img src={video.thumbnail} alt={video.title} className="h-32 w-full rounded-t-lg bg-muted object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <Play className="h-8 w-8 text-white" />
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
        </div>
      </div>
      <div className="p-4">
        <h4 className="mb-2 line-clamp-2 text-sm font-medium">{video.title}</h4>
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          <span className="capitalize">{video.type}</span>
        </div>
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{video.views}</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{video.likes}</span>
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              <span>{video.comments}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded bg-primary px-3 py-2 text-xs text-primary-foreground"
          >
            <Youtube className="h-3 w-3" />
            View Video
          </a>
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="rounded p-2 text-muted-foreground hover:bg-muted">
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>
        {showAnalytics && (
          <div className="mt-3 rounded-lg bg-muted p-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Views:</span>
                <span className="ml-1 font-medium">{video.views}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Likes:</span>
                <span className="ml-1 font-medium">{video.likes}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Comments:</span>
                <span className="ml-1 font-medium">{video.comments}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Engagement:</span>
                <span className="ml-1 font-medium">{(((video.likes + video.comments) / Math.max(video.views, 1)) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EnhancedContentLibrary({ generatedContent, setGeneratedContent }: any) {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filterOptions = [
    { id: "all", name: "All Content" },
    { id: "video", name: "Videos" },
    { id: "twitter", name: "Twitter" },
    { id: "linkedin", name: "LinkedIn" },
    { id: "facebook", name: "Facebook" },
    { id: "instagram", name: "Instagram" },
  ];

  const filteredContent = generatedContent.filter((content: any) => {
    if (filter === "all") return true;
    return content.platform === filter || content.type === filter;
  });

  return (
    <div className="rounded-lg border">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">All Content</h3>
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded border bg-background px-3 py-1 text-sm"
            >
              {filterOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border bg-background px-3 py-1 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="platform">By Platform</option>
            </select>
          </div>
        </div>
      </div>
      <div className="p-4">
        {filteredContent.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <FileVideo className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
            No content available. Generate some content or create videos to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredContent.map((content: any) => (
              <EnhancedContentCard key={content.id} content={content} setGeneratedContent={setGeneratedContent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EnhancedContentCard({ content }: any) {
  const isVideo = content.platform === "youtube" || content.type === "video";

  const getPlatformIcon = () => {
    switch (content.platform) {
      case "youtube":
        return Youtube;
      case "twitter":
        return Twitter; // fixed from X to Twitter
      case "linkedin":
        return Linkedin;
      case "facebook":
        return Facebook;
      case "instagram":
        return Instagram;
      default:
        return FileVideo;
    }
  };

  const getPlatformColor = () => {
    switch (content.platform) {
      case "youtube":
        return "bg-red-500";
      case "twitter":
        return "bg-blue-500";
      case "linkedin":
        return "bg-blue-700";
      case "facebook":
        return "bg-blue-600";
      case "instagram":
        return "bg-pink-500";
      default:
        return "bg-muted";
    }
  };

  const PlatformIcon = getPlatformIcon();

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${getPlatformColor()}`}>
            <PlatformIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium capitalize">{content.platform}</span>
              <span className="text-sm text-muted-foreground">• {content.type}</span>
            </div>
            <div className="text-xs text-muted-foreground">{content.createdAt}</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          <CheckCircle className="h-4 w-4" />
          Published
        </div>
      </div>

      {isVideo && content.videoData ? (
        <div className="mb-4">
          <div className="relative mb-3">
            <img src={content.videoData.thumbnail} alt={content.videoData.title} className="h-32 w-full rounded bg-muted object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Play className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium">{content.videoData.title}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              {Math.floor(content.videoData.duration / 60)}:{(content.videoData.duration % 60).toString().padStart(2, "0")}
            </span>
            <span>{content.videoData.views} views</span>
            <span>{content.videoData.likes} likes</span>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <p className="line-clamp-3 whitespace-pre-wrap text-sm">{content.content || "No content available"}</p>
          {content.hashtags && content.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {content.hashtags.map((hashtag: string, index: number) => (
                <span key={index} className="text-xs text-primary">
                  {hashtag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{isVideo ? "Video" : `${(content.content || "").length} characters`}</span>
          {content.publishedAt && <span>• Published {new Date(content.publishedAt).toLocaleDateString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          {isVideo && content.videoData ? (
            <a
              href={content.videoData.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-sm text-primary-foreground"
            >
              <Youtube className="h-4 w-4" /> View Video
            </a>
          ) : (
            <button className="rounded px-3 py-1 text-sm text-primary hover:bg-primary/10">Preview</button>
          )}
        </div>
      </div>
    </div>
  );
}
