export const event_name = Object.freeze(
    {
        conversation: {
            message: "conversation_message",
            seen: "conversation_message_seen",
            typing: "conversation_user_keyboard_pressing",
            listRefetch: "conversation_list_refetch",
        },
        notification: {
            post: "notification_post",
            followRequest: {}
        },
        webRtc: {
            offer: "offer",
            answer: "answer",
            candidate: "candidate",
            peerLeft: "peerLeft",
            sendCall: "send-call",
            answerCall: "answer-call",
            callAction: "call-action",
        },
        calling: {
            // server
            requestForCall: "request-for-call",
            answerIncomingCall: "answer-incoming-call",
            // 
            prepareSession: "prepare-session",
            joinSession: "join-session",
            currentRoom: "current-room",
            sendOffer: "send-offer",
            sendAnswer: "send-answer",
            sendIceCandidate: "send-ice-candidate",
            toggleAction: "toggle-action", // toggle-video,toggle-muted,toggle-video                
            sendEmoji: "send-emoji",
            sendChat: "send-chat",
            hangUp: "hang-up",
            // client
            error: "error",
            sessionInfo: "session-info",
            allParticipants: "all-participants",
            newParticipant: "new-participant",
            receiveOffer: "receive-offer",
            receiveAnswer: "receive-answer",
            receiveIceCandidate: "receive-ice-candidate",
            emojiUpdate: "emoji-update",
            receiveChat: "receive-chat",
            participantActionUpdate: "participant-action-update",
            participantLeft: "participant-left",
        }
    }
)