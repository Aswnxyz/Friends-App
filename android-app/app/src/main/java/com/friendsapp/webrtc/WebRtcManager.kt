package com.friendsapp.webrtc

import android.content.Context
import com.friendsapp.models.CallType
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

/**
 * Native Android WebRTC & Socket.io Signaling Manager
 *
 * Call Matrix Enforced:
 * - Normal User <-> Normal User: RANDOM_AUDIO & RANDOM_VIDEO
 * - Normal User (Premium) <-> Celebrity: CELEBRITY_AUDIO & CELEBRITY_VIDEO
 * - Normal User / Celebrity <-> Customer Care Support: SUPPORT_AUDIO ONLY (Video Call prohibited)
 */
class WebRtcManager(
    private val context: Context,
    private val signalingUrl: String
) {
    private var socket: Socket? = null
    var isMicrophoneMuted: Boolean = false
        private set
    var isCameraEnabled: Boolean = false
        private set

    fun connectSignaling(userId: String, onMatchFound: (roomId: String, peerName: String, callType: CallType) -> Unit) {
        val options = IO.Options.builder()
            .setQuery("userId=$userId")
            .build()

        socket = IO.socket(signalingUrl, options).apply {
            on("match:found") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as JSONObject
                    val roomId = data.optString("roomId")
                    val mode = data.optString("mode", "AUDIO")
                    val peer = data.optJSONObject("peer")
                    val peerName = peer?.optString("displayName") ?: "Online Friend"
                    val callType = if (mode == "VIDEO") CallType.RANDOM_VIDEO else CallType.RANDOM_AUDIO
                    isCameraEnabled = (callType == CallType.RANDOM_VIDEO)
                    onMatchFound(roomId, peerName, callType)
                }
            }
            connect()
        }
    }

    /**
     * Join Random Friend Queue in either AUDIO or VIDEO mode
     */
    fun joinRandomQueue(userId: String, enableVideo: Boolean) {
        val mode = if (enableVideo) "VIDEO" else "AUDIO"
        isCameraEnabled = enableVideo
        val payload = JSONObject().apply {
            put("userId", userId)
            put("mode", mode)
        }
        socket?.emit("queue:join", payload)
    }

    /**
     * Initiate Customer Care Support Call (Strictly Audio-Only)
     */
    fun startCustomerCareAudioCall(userId: String) {
        isCameraEnabled = false // Video is strictly disabled for Customer Care
        val payload = JSONObject().apply {
            put("userId", userId)
            put("mode", "AUDIO")
        }
        socket?.emit("support:call", payload)
    }

    fun toggleMicrophone(): Boolean {
        isMicrophoneMuted = !isMicrophoneMuted
        return isMicrophoneMuted
    }

    fun toggleCamera(activeCallType: CallType): Boolean {
        if (activeCallType == CallType.SUPPORT_AUDIO || activeCallType == CallType.RANDOM_AUDIO || activeCallType == CallType.CELEBRITY_AUDIO) {
            isCameraEnabled = false
            return false
        }
        isCameraEnabled = !isCameraEnabled
        return isCameraEnabled
    }

    fun endCall(roomId: String) {
        val payload = JSONObject().apply {
            put("roomId", roomId)
        }
        socket?.emit("call:end", payload)
        isCameraEnabled = false
    }

    fun disconnect() {
        socket?.disconnect()
    }
}
