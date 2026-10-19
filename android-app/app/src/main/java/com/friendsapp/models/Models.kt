package com.friendsapp.models

enum class UserRole {
    USER,
    CELEBRITY,
    ORGANIZATION,
    SUPPORT,
    SUPER_ADMIN
}

enum class CallType {
    RANDOM_AUDIO,
    RANDOM_VIDEO,
    CELEBRITY_AUDIO,
    CELEBRITY_VIDEO,
    SUPPORT_AUDIO
}

data class UserProfile(
    val id: String,
    val phone: String,
    val role: UserRole,
    val displayName: String,
    val city: String,
    val isPremium: Boolean,
    val walletCoins: Int,
    val status: String
)

data class CelebrityCard(
    val id: String,
    val displayName: String,
    val category: String,
    val bio: String,
    val audioRatePerMin: Int,
    val videoRatePerMin: Int,
    val availability: String,
    val mediaCount: Int
)

data class EventCard(
    val id: String,
    val title: String,
    val organizationName: String,
    val venueName: String,
    val city: String,
    val distanceKm: Double,
    val ticketPrice: Double,
    val remainingSeats: Int
)
