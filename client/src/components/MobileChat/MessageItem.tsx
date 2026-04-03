import { useStore } from "@/stores/sessionStore";
import type { Message } from "@color-wars/shared";
import { cn } from "@/lib/utils";
import { AvatarColorMap } from "../Player";

interface MessageItemProps {
  message: Message;
  showSender?: boolean;
}

export function MessageItem({ message, showSender = true }: MessageItemProps) {
  const currentPlayerId = useStore((z) => z.currentPlayer?.id);
  const isMe = currentPlayerId === message.senderId;

  // Retrieve sender info for color
  const sender = useStore((z) => 
    z.state.game.players ? z.state.game.players[message.senderId] : null
  );
  const senderName = sender?.name || message.senderId;
  const senderColor = sender?.color || "#64748b";

  return (
    <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start", !showSender && "-mt-3")}>
      <div className={cn("flex flex-col max-w-[85%]", isMe ? "items-end" : "items-start")}>
        
        {/* Name Label (Only if showSender is true and it's not the user) */}
        {!isMe && showSender && (
          <span 
            className="text-xs font-bold mb-1 ml-1 opacity-90 flex items-center gap-2" 
            style={{ color: senderColor }}
          >
            <img 
              className="h-6 w-6 rounded-full object-cover" 
              src={AvatarColorMap[senderColor as keyof typeof AvatarColorMap] || AvatarColorMap["#64748b"]} 
              alt="" 
            />
            {senderName}
          </span>
        )}
        
        <div
          className={cn(
            "px-4 py-2 text-sm break-all whitespace-pre-wrap shadow-sm leading-relaxed",
            isMe 
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none" 
              : cn(
                  "bg-secondary text-secondary-foreground rounded-2xl rounded-tl-none",
                  "ml-9"
                )
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}