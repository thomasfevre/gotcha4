import { useState } from "react"
import { Mail, Send, X } from "lucide-react"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuTextarea } from "@/components/ui/neu-textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create mailto link with form data
      const subject = formData.subject || "Contact from Gotcha App"
      const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      
      const mailtoLink = `mailto:thomas.fevre@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      // Open email client
      window.location.href = mailtoLink
      
      toast({
        title: "Email client opened",
        description: "Your default email client should open with the message pre-filled."
      })
      
      // Reset form and close modal
      setFormData({ name: "", email: "", subject: "", message: "" })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open email client. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2"
        onClick={onClose}
      >
        {/* Modal */}
        <NeuCard 
          className="w-full max-w-md max-h-[90vh] overflow-y-auto p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Contact Thomas</h2>
            </div>
            <NeuButton
              variant="flat"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </NeuButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <NeuInput
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <NeuInput
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <NeuInput
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="What's this about?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <NeuTextarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Your message..."
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <NeuButton
                type="button"
                variant="flat"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </NeuButton>
              <NeuButton
                type="submit"
                variant="primary"
                className="flex-1 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Opening..."
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Email
                  </>
                )}
              </NeuButton>
            </div>
          </form>

          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              This will open your default email client with the message pre-filled. 
              You can then send it directly from your email app.
            </p>
          </div>
        </NeuCard>
      </div>
    </>
  )
}
