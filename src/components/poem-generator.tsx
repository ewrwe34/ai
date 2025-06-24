
'use client';

import { useState, useTransition, useRef, type ChangeEvent, type DragEvent } from 'react';
import Image from 'next/image';
import {
  Copy,
  Download,
  Languages,
  Link,
  Loader2,
  Palette,
  Share2,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  generatePoemAction,
  getImageFromUrlAction,
  translatePoemAction,
} from '@/app/actions';

type CustomizationState = {
  tone: string;
  style: string;
  length: string;
};

export function PoemGenerator() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [image, setImage] = useState<string | null>(null);
  const [poem, setPoem] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [customization, setCustomization] = useState<CustomizationState>({
    tone: 'reflective',
    style: 'free verse',
    length: 'medium',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setImage(null);
    setPoem('');
    setError(null);
    setImageUrl('');
  };

  const handlePoemGeneration = (photoDataUri: string) => {
    startTransition(async () => {
      setError(null);
      setPoem('');
      const result = await generatePoemAction({
        photoDataUri,
        ...customization,
      });
      if (result.success) {
        setPoem(result.poem);
      } else {
        setError(result.error);
        toast({
          variant: 'destructive',
          title: 'Error generating poem',
          description: result.error,
        });
        setImage(null);
      }
    });
  };
  
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload an image.' });
        return;
    }
    resetState();
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setImage(dataUri);
        handlePoemGeneration(dataUri);
    };
    reader.readAsDataURL(file);
  }

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (!imageUrl) return;
    resetState();
    startTransition(async () => {
      const result = await getImageFromUrlAction(imageUrl);
      if (result.success && result.dataUri) {
        setImage(result.dataUri);
        handlePoemGeneration(result.dataUri);
      } else {
        setError(result.error);
        toast({
          variant: 'destructive',
          title: 'Error fetching image',
          description: result.error,
        });
      }
    });
  };

  const handleCustomizationChange = <K extends keyof CustomizationState>(key: K, value: CustomizationState[K]) => {
    if (!image) {
      toast({ title: 'Please upload an image first.' });
      return;
    }
    
    const newCustomization = { ...customization, [key]: value };
    setCustomization(newCustomization);

    startTransition(async () => {
      setError(null);
      const result = await generatePoemAction({ photoDataUri: image, ...newCustomization });

      if (result?.success) {
        setPoem(result.poem);
        toast({ title: `Poem updated successfully!` });
      } else if (result) {
        setError(result.error);
        toast({ variant: 'destructive', title: `Error updating poem`, description: result.error });
      }
    });
  };

  const handleTranslate = () => {
    if (!poem) {
      toast({ title: 'Please generate a poem first.' });
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await translatePoemAction({ poem, language: 'Arabic' });
      if (result.success) {
        setPoem(result.poem);
        toast({ title: 'Poem translated to Arabic!' });
      } else {
        setError(result.error);
        toast({
          variant: 'destructive',
          title: 'Error translating poem',
          description: result.error,
        });
      }
    });
  };

  const handleDownload = () => {
    const blob = new Blob([poem], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'snapverse-poem.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Poem downloaded!' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(poem).then(() => {
      toast({ title: 'Poem copied to clipboard!' });
    }).catch(err => {
      toast({ variant: 'destructive', title: 'Failed to copy', description: err.message });
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'A Poem from SnapVerse',
        text: poem,
      }).catch(err => {
        if (err.name !== 'AbortError') {
          toast({ variant: 'destructive', title: 'Sharing failed', description: err.message });
        }
      });
    } else {
      handleCopy();
      toast({ title: 'Share not supported. Copied to clipboard instead.' });
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-fade-in">
      <Card className="w-full sticky top-24">
        <CardHeader>
          <CardTitle className="font-headline">Upload Your Photo</CardTitle>
          <CardDescription>
            Choose a photo from your device or paste an image URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <UploadCloud className="mr-2 h-4 w-4" /> Upload
              </TabsTrigger>
              <TabsTrigger value="url">
                <Link className="mr-2 h-4 w-4" /> URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'mt-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragging ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  {isDragging ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                </p>
              </div>
            </TabsContent>
            <TabsContent value="url">
              <div className="mt-4 flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isPending}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <Button onClick={handleUrlSubmit} disabled={isPending || !imageUrl}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'Go'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 aspect-square w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {image ? (
              <Image
                src={image}
                alt="Uploaded inspiration"
                width={600}
                height={600}
                className="object-cover w-full h-full"
                data-ai-hint="photo"
              />
            ) : (
              <div className="text-center text-muted-foreground p-4">
                <Wand2 className="mx-auto h-12 w-12" />
                <p className="mt-2">Your image will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-headline">Your Poem</CardTitle>
          <CardDescription>
            An original poem inspired by your photo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && !poem && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}

          {poem && (
            <>
              <Textarea
                readOnly
                value={poem}
                className="min-h-[200px] text-base font-body bg-background/50 whitespace-pre-wrap"
                rows={10}
                dir={/[\u0600-\u06FF]/.test(poem) ? 'rtl' : 'ltr'}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleDownload} disabled={isPending}>
                  <Download className="mr-2" /> Download
                </Button>
                <Button variant="outline" onClick={handleCopy} disabled={isPending}>
                  <Copy className="mr-2" /> Copy
                </Button>
                <Button variant="outline" onClick={handleShare} disabled={isPending}>
                  <Share2 className="mr-2" /> Share
                </Button>
                <Button variant="outline" onClick={handleTranslate} disabled={isPending}>
                  <Languages className="mr-2" /> Translate to Arabic
                </Button>
              </div>
            </>
          )}

          {!isPending && !poem && (
            <div className="text-center text-muted-foreground p-8">
              <Palette className="mx-auto h-12 w-12" />
              <p className="mt-2">Your generated poem will be displayed here.</p>
            </div>
          )}
          
          {poem && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-headline font-semibold">Customize Your Poem</h3>
              <p className="text-sm text-muted-foreground mb-4">Refine the tone, style, or length.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select onValueChange={(v) => handleCustomizationChange('tone', v)} defaultValue={customization.tone} disabled={isPending}>
                  <SelectTrigger><SelectValue placeholder="Tone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="optimistic">Optimistic</SelectItem>
                    <SelectItem value="melancholic">Melancholic</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="reflective">Reflective</SelectItem>
                    <SelectItem value="whimsical">Whimsical</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(v) => handleCustomizationChange('style', v)} defaultValue={customization.style} disabled={isPending}>
                  <SelectTrigger><SelectValue placeholder="Style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haiku">Haiku</SelectItem>
                    <SelectItem value="limerick">Limerick</SelectItem>
                    <SelectItem value="free verse">Free Verse</SelectItem>
                  </SelectContent>
                </Select>
                 <Select onValueChange={(v) => handleCustomizationChange('length', v)} defaultValue={customization.length} disabled={isPending}>
                  <SelectTrigger><SelectValue placeholder="Length" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
