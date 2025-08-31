"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt: string
}

export function ImageModal({ isOpen, onClose, src, alt }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[90vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
