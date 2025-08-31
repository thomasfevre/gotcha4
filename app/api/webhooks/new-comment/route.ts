import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { DatabaseService } from "@/lib/database"
import { validateWebhookSignature } from "@/lib/security"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Security: Verify webhook signature from Supabase
    const signature = request.headers.get("x-supabase-signature")
    const body = await request.text()
    
    // if (!validateWebhookSignature(body, signature)) {
    //   console.error("Invalid webhook signature")
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const webhookData = JSON.parse(body)
    const { record: comment, type } = webhookData

    // Only process INSERT events (new comments)
    if (type !== "INSERT") {
      return NextResponse.json({ message: "Event type not handled" })
    }

    // Get the annoyance details and post owner info
    const supabase = await DatabaseService.getSupabaseClient()
    
    // Get annoyance with owner info
    const { data: annoyanceData, error: annoyanceError } = await supabase
      .from("annoyances")
      .select(`
        id,
        title,
        user_id,
        profiles!inner(username, notification_email, notifications_enabled)
      `)
      .eq("id", comment.annoyance_id)
      .single()

    if (annoyanceError || !annoyanceData) {
      console.error("Error fetching annoyance:", annoyanceError)
      return NextResponse.json({ error: "Annoyance not found" }, { status: 404 })
    }

    // Get commenter info
    const { data: commenterData, error: commenterError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", comment.user_id)
      .single()

    if (commenterError || !commenterData) {
      console.error("Error fetching commenter:", commenterError)
      return NextResponse.json({ error: "Commenter not found" }, { status: 404 })
    }

    const postOwner = annoyanceData.profiles[0] // Fix: profiles is an array
    const commenterUsername = commenterData.username

    // Don't send notification if:
    // 1. Post owner is the commenter (self-comment)
    // 2. Post owner has notifications disabled
    // 3. Post owner has no notification email set
    if (
      comment.user_id === annoyanceData.user_id ||
      !postOwner.notifications_enabled ||
      !postOwner.notification_email
    ) {
      return NextResponse.json({ message: "Notification not sent - criteria not met" })
    }

    // Send email notification
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Gotcha <notifications@yourdomain.com>",
      to: [postOwner.notification_email],
      subject: `${commenterUsername} commented on your post`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Comment on Your Post!</h2>
          
          <p>Hey ${postOwner.username}!</p>
          
          <p><strong>${commenterUsername}</strong> left a new comment on your annoyance: 
          <strong>"${annoyanceData.title}"</strong></p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <em>"${comment.content}"</em>
          </div>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/annoyances/${comment.annoyance_id}" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Full Discussion
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            You're receiving this because you have notifications enabled. 
            You can update your notification preferences in your profile settings.
          </p>
        </div>
      `,
    })

    console.log(`Notification sent to ${postOwner.notification_email} for comment on annoyance ${comment.annoyance_id}`)

    return NextResponse.json({ message: "Notification sent successfully" })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Error processing notification" }, { status: 500 })
  }
}
