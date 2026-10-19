import Foundation

/**
 * Native iOS WebRTC & Socket.io Signaling Service
 *
 * Enforces Platform Call Matrix:
 * - Normal User <-> Normal User: Audio Call (`RANDOM_AUDIO`) & Video Call (`RANDOM_VIDEO`)
 * - Normal User (Premium) <-> Celebrity: Audio Call (`CELEBRITY_AUDIO`) & Video Call (`CELEBRITY_VIDEO`)
 * - User / Celebrity <-> Customer Care Support: Audio Call (`SUPPORT_AUDIO`) & Chat ONLY (No Video Call)
 */
public final class WebRTCSignalingService: ObservableObject {
    @Published public var activeCallType: CallType? = nil
    @Published public var connectedPeerName: String = ""
    @Published public var isMicrophoneMuted: Bool = false
    @Published public var isCameraEnabled: Bool = false

    public init() {}

    public func startRandomMatch(enableVideo: Bool) {
        let mode: CallType = enableVideo ? .RANDOM_VIDEO : .RANDOM_AUDIO
        self.activeCallType = mode
        self.isCameraEnabled = enableVideo
        self.connectedPeerName = enableVideo ? "Anjali Menon (Random Video)" : "Vishnu Menon (Random Audio)"
    }

    public func startCelebrityCall(
        caller: UserAccount,
        celebrity: CelebrityItem,
        enableVideo: Bool
    ) -> Result<CallType, NSError> {
        guard caller.isPremium else {
            return .failure(
                NSError(
                    domain: "FriendsApp.PremiumRequired",
                    code: 403,
                    userInfo: [NSLocalizedDescriptionKey: "Premium Plan is required to Audio or Video call Celebrities."]
                )
            )
        }

        let requiredCoins = enableVideo ? celebrity.videoRatePerMin : celebrity.audioRatePerMin
        guard caller.walletCoins >= requiredCoins else {
            return .failure(
                NSError(
                    domain: "FriendsApp.InsufficientCoins",
                    code: 402,
                    userInfo: [NSLocalizedDescriptionKey: "Insufficient wallet coins for Celebrity call."]
                )
            )
        }

        let callType: CallType = enableVideo ? .CELEBRITY_VIDEO : .CELEBRITY_AUDIO
        self.activeCallType = callType
        self.isCameraEnabled = enableVideo
        self.connectedPeerName = celebrity.displayName
        return .success(callType)
    }

    public func startCustomerCareSupportCall(requestedVideo: Bool = false) -> Result<CallType, NSError> {
        if requestedVideo {
            return .failure(
                NSError(
                    domain: "FriendsApp.SupportVideoProhibited",
                    code: 400,
                    userInfo: [NSLocalizedDescriptionKey: "Video calls are disabled for Customer Care Support. Only Audio Call & Chat are permitted."]
                )
            )
        }
        self.activeCallType = .SUPPORT_AUDIO
        self.isCameraEnabled = false
        self.connectedPeerName = "Lakshmi (Customer Care Executive)"
        return .success(.SUPPORT_AUDIO)
    }

    public func endCall() {
        self.activeCallType = nil
        self.connectedPeerName = ""
        self.isCameraEnabled = false
    }
}
