package com.friendsapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendsapp.models.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                FriendsAndroidApp()
            }
        }
    }
}

@Composable
fun FriendsAndroidApp() {
    var currentUser by remember {
        mutableStateOf(
            UserProfile(
                id = "usr-rahul-01",
                phone = "+919876543210",
                role = UserRole.USER,
                displayName = "Rahul Nair",
                city = "Kochi",
                isPremium = false,
                walletCoins = 120,
                status = "ACTIVE"
            )
        )
    }

    var selectedTab by remember { mutableStateOf("RANDOM") }
    var activeCall by remember { mutableStateOf<Pair<CallType, String>?>(null) }
    var statusMessage by remember { mutableStateOf("Welcome to Friends App Native Android") }

    val sampleCelebrities = remember {
        listOf(
            CelebrityCard(
                id = "cel-tovino-01",
                displayName = "Aarav Krishna (Actor)",
                category = "Film Actor & Youth Icon",
                bio = "Malayalam Cinema Actor — Connect via Audio or Video Call!",
                audioRatePerMin = 30,
                videoRatePerMin = 75,
                availability = "AVAILABLE",
                mediaCount = 14
            ),
            CelebrityCard(
                id = "cel-sithara-02",
                displayName = "Meera Nandan (Singer)",
                category = "Playback Singer",
                bio = "Unplugged musical video & audio calls for Premium fans",
                audioRatePerMin = 25,
                videoRatePerMin = 60,
                availability = "AVAILABLE",
                mediaCount = 9
            )
        )
    }

    val sampleEvents = remember {
        listOf(
            EventCard(
                id = "evt-01",
                title = "Kochi Neon Music & Friends Fest 2026",
                organizationName = "Malabar Live Events Pvt Ltd",
                venueName = "Bolgatty Event Island, Kochi",
                city = "Kochi",
                distanceKm = 4.2,
                ticketPrice = 499.0,
                remainingSeats = 358
            ),
            EventCard(
                id = "evt-02",
                title = "Shangumugham Sunset Acoustic Night",
                organizationName = "Malabar Live Events Pvt Ltd",
                venueName = "Shangumugham Beach Amphitheatre",
                city = "Trivandrum",
                distanceKm = 195.0,
                ticketPrice = 350.0,
                remainingSeats = 190
            )
        )
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF090D16)
    ) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            // Top Role Bar
            Text(
                text = "Friends App • Android Native (${currentUser.role})",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "${currentUser.displayName} (${currentUser.phone}) • Coins: ${currentUser.walletCoins} • ${if (currentUser.isPremium) "PREMIUM VIP" else "FREE PLAN"}",
                fontSize = 12.sp,
                color = Color(0xFF94A3B8)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Role Switcher Row for all 5 roles
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                UserRole.values().forEach { role ->
                    FilterChip(
                        selected = currentUser.role == role,
                        onClick = {
                            currentUser = currentUser.copy(role = role)
                            statusMessage = "Switched role to $role"
                        },
                        label = { Text(role.name, fontSize = 10.sp) }
                    )
                }
            }

            // Status Banner
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
            ) {
                Text(
                    text = statusMessage,
                    modifier = Modifier.padding(10.dp),
                    fontSize = 12.sp,
                    color = Color(0xFF38BDF8)
                )
            }

            // Active Call Banner (Audio or Video)
            activeCall?.let { (callType, peerName) ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF312E81)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "LIVE ${callType.name.replace("_", " ")}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFA5B4FC)
                        )
                        Text(
                            text = "Connected with $peerName",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        if (callType == CallType.RANDOM_VIDEO || callType == CallType.CELEBRITY_VIDEO) {
                            Text(
                                text = "[HD WebRTC Local & Remote Video Streams Active]",
                                fontSize = 12.sp,
                                color = Color(0xFF34D399)
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                activeCall = null
                                statusMessage = "Call ended"
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48))
                        ) {
                            Text("End Call")
                        }
                    }
                }
            }

            // Bottom/Section Navigation Tabs
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("RANDOM", "CELEBRITIES", "EVENTS", "SUPPORT", "ADMIN").forEach { tab ->
                    Button(
                        onClick = { selectedTab = tab },
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(4.dp)
                    ) {
                        Text(tab, fontSize = 10.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Tab Views
            when (selectedTab) {
                "RANDOM" -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "Random Friend Connect (Audio & Video Call)",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "ഓൺലൈനിലുള്ള ഫ്രണ്ട്സുമായി റാണ്ടമായി ഓഡിയോ കോളോ വീഡിയോ കോളോ ചെയ്യാം.",
                                fontSize = 13.sp,
                                color = Color(0xFF94A3B8)
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Button(
                                    onClick = {
                                        activeCall = CallType.RANDOM_AUDIO to "Vishnu Menon (Kochi)"
                                        statusMessage = "Matched Random Audio Call with Vishnu Menon!"
                                    },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Random Audio Call")
                                }
                                Button(
                                    onClick = {
                                        activeCall = CallType.RANDOM_VIDEO to "Anjali Menon (Trivandrum)"
                                        statusMessage = "Matched Random Video Call with Anjali Menon!"
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF9333EA))
                                ) {
                                    Text("Random Video Call")
                                }
                            }
                        }
                    }
                }

                "CELEBRITIES" -> {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        if (!currentUser.isPremium) {
                            item {
                                Button(
                                    onClick = {
                                        currentUser = currentUser.copy(
                                            isPremium = true,
                                            walletCoins = currentUser.walletCoins + 500
                                        )
                                        statusMessage = "Upgraded to Premium Plan! Celebrity Audio & Video calls unlocked."
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
                                ) {
                                    Text("Upgrade to Premium VIP (Unlock Celebrity Audio & Video Calls)", color = Color.Black)
                                }
                            }
                        }
                        items(sampleCelebrities) { celeb ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(celeb.displayName, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                                    Text("${celeb.category} • ${celeb.mediaCount} Photos & Videos", fontSize = 12.sp, color = Color(0xFFF472B6))
                                    Text(celeb.bio, fontSize = 12.sp, color = Color(0xFFCBD5E1))
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = {
                                                if (!currentUser.isPremium) {
                                                    statusMessage = "Premium Plan required to Audio Call ${celeb.displayName}!"
                                                } else {
                                                    activeCall = CallType.CELEBRITY_AUDIO to celeb.displayName
                                                    statusMessage = "Started Celebrity Audio Call with ${celeb.displayName}"
                                                }
                                            },
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Text("Audio (${celeb.audioRatePerMin}/m)", fontSize = 12.sp)
                                        }
                                        Button(
                                            onClick = {
                                                if (!currentUser.isPremium) {
                                                    statusMessage = "Premium Plan required to Video Call ${celeb.displayName}!"
                                                } else {
                                                    activeCall = CallType.CELEBRITY_VIDEO to celeb.displayName
                                                    statusMessage = "Started Celebrity Video Call with ${celeb.displayName}"
                                                }
                                            },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDB2777))
                                        ) {
                                            Text("Video (${celeb.videoRatePerMin}/m)", fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                "EVENTS" -> {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(sampleEvents) { evt ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text("${evt.distanceKm} km away • ${evt.city}", fontSize = 11.sp, color = Color(0xFF34D399))
                                    Text(evt.title, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                                    Text("${evt.venueName} • Hosted by ${evt.organizationName}", fontSize = 12.sp, color = Color(0xFF94A3B8))
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Button(
                                        onClick = {
                                            statusMessage = "Ticket booked for ${evt.title} (₹${evt.ticketPrice})!"
                                        }
                                    ) {
                                        Text("Book Ticket (₹${evt.ticketPrice.toInt()})")
                                    }
                                }
                            }
                        }
                    }
                }

                "SUPPORT" -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("24/7 Customer Care Support", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                            Text(
                                "Available for Normal Users & Celebrities via Live Chat & Audio Call ONLY. (Video Call is disabled for Customer Care).",
                                fontSize = 12.sp,
                                color = Color(0xFF94A3B8)
                            )
                            Button(
                                onClick = {
                                    activeCall = CallType.SUPPORT_AUDIO to "Lakshmi (Customer Care Executive)"
                                    statusMessage = "Connected Audio-Only Support Call with Customer Care"
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0891B2))
                            ) {
                                Text("Call Customer Care (Audio Call Only)")
                            }
                        }
                    }
                }

                "ADMIN" -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("Super Admin Moderation Control", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                            Text(
                                "Block users, limit Random Audio/Video calls, restrict Event publishing, and approve Celebrity/Organization profiles.",
                                fontSize = 12.sp,
                                color = Color(0xFF94A3B8)
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = { statusMessage = "Super Admin applied BAN_RANDOM_VIDEO restriction" },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706))
                                ) {
                                    Text("Limit Video Calls", fontSize = 12.sp)
                                }
                                Button(
                                    onClick = { statusMessage = "Super Admin blocked offending user account" },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48))
                                ) {
                                    Text("Block Account", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
