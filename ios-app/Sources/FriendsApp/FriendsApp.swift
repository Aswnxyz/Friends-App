import SwiftUI

public struct FriendsMainView: View {
    @StateObject private var rtcService = WebRTCSignalingService()

    @State private var currentUser = UserAccount(
        id: "usr-rahul-01",
        phone: "+919876543210",
        role: .USER,
        displayName: "Rahul Nair",
        city: "Kochi",
        isPremium: false,
        walletCoins: 120
    )

    @State private var statusBanner: String = "Welcome to Friends App Native iOS (SwiftUI)"

    private let celebrities: [CelebrityItem] = [
        CelebrityItem(
            id: "cel-01",
            displayName: "Aarav Krishna (Actor)",
            category: "Film Actor & Youth Icon",
            bio: "Connect with me live via Audio or Video Call!",
            audioRatePerMin: 30,
            videoRatePerMin: 75,
            availability: "AVAILABLE",
            mediaCount: 14
        ),
        CelebrityItem(
            id: "cel-02",
            displayName: "Meera Nandan (Singer)",
            category: "Playback Singer",
            bio: "Available for unplugged musical video & audio calls!",
            audioRatePerMin: 25,
            videoRatePerMin: 60,
            availability: "AVAILABLE",
            mediaCount: 9
        )
    ]

    private let events: [NearbyEventItem] = [
        NearbyEventItem(
            id: "evt-01",
            title: "Kochi Neon Music & Friends Fest 2026",
            organizationName: "Malabar Live Events Pvt Ltd",
            venueName: "Bolgatty Event Island, Kochi",
            city: "Kochi",
            distanceKm: 4.2,
            ticketPrice: 499,
            remainingSeats: 358
        ),
        NearbyEventItem(
            id: "evt-02",
            title: "Shangumugham Sunset Acoustic Night",
            organizationName: "Malabar Live Events Pvt Ltd",
            venueName: "Shangumugham Beach Amphitheatre",
            city: "Trivandrum",
            distanceKm: 195.0,
            ticketPrice: 350,
            remainingSeats: 190
        )
    ]

    public init() {}

    public var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                // Role Switcher Picker (5 Roles)
                Picker("Active Role", selection: $currentUser.role) {
                    ForEach(UserRole.allCases, id: \.self) { role in
                        Text(role.rawValue).tag(role)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                // Status & Wallet Bar
                HStack {
                    VStack(alignment: .leading) {
                        Text("\(currentUser.displayName) • \(currentUser.role.rawValue)")
                            .font(.headline)
                        Text(statusBanner)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("\(currentUser.walletCoins) Coins")
                        .font(.caption.bold())
                        .padding(6)
                        .background(Color.green.opacity(0.2))
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                // Active Call Card (Audio or Video)
                if let activeCall = rtcService.activeCallType {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("LIVE \(activeCall.rawValue) • \(rtcService.connectedPeerName)")
                            .font(.subheadline.bold())
                            .foregroundStyle(.white)
                        if activeCall.isVideoAllowed {
                            Text("HD WebRTC Camera Video Stream Active (Local + Remote)")
                                .font(.caption)
                                .foregroundStyle(.green)
                        } else {
                            Text("WebRTC Encrypted Voice Audio Stream Active")
                                .font(.caption)
                                .foregroundStyle(.cyan)
                        }
                        Button(role: .destructive) {
                            rtcService.endCall()
                            statusBanner = "Call Ended"
                        } label: {
                            Text("End Call")
                                .font(.caption.bold())
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.indigo.opacity(0.85))
                    .cornerRadius(14)
                    .padding(.horizontal)
                }

                // Main TabView
                TabView {
                    // 1. Random Friend Connect (Audio & Video Call)
                    VStack(spacing: 16) {
                        Text("Random Friend Connect (Audio & Video)")
                            .font(.title3.bold())
                        Text("ഓൺലൈനിലുള്ള ഫ്രണ്ട്സുമായി റാണ്ടമായി ഓഡിയോ കോളോ വീഡിയോ കോളോ ചെയ്യാം.")
                            .font(.caption)
                            .multilineTextAlignment(.center)

                        HStack(spacing: 12) {
                            Button {
                                rtcService.startRandomMatch(enableVideo: false)
                                statusBanner = "Matched Random Audio Call!"
                            } label: {
                                Label("Random Audio Call", systemImage: "phone.fill")
                            }
                            .buttonStyle(.borderedProminent)

                            Button {
                                rtcService.startRandomMatch(enableVideo: true)
                                statusBanner = "Matched Random Video Call!"
                            } label: {
                                Label("Random Video Call", systemImage: "video.fill")
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.purple)
                        }
                    }
                    .padding()
                    .tabItem {
                        Label("Random Call", systemImage: "person.2.wave.2.fill")
                    }

                    // 2. Celebrities Lounge (Photos/Videos + Premium Audio & Video Calls)
                    List(celebrities) { celeb in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(celeb.displayName)
                                .font(.headline)
                            Text("\(celeb.category) • \(celeb.mediaCount) Photos & Videos")
                                .font(.caption)
                                .foregroundStyle(.pink)
                            Text(celeb.bio)
                                .font(.caption)

                            if !currentUser.isPremium {
                                Button("Upgrade to Premium Plan (₹499)") {
                                    currentUser.isPremium = true
                                    currentUser.walletCoins += 500
                                    statusBanner = "Premium VIP Activated! Celebrity Audio & Video calls unlocked."
                                }
                                .font(.caption.bold())
                                .tint(.orange)
                            }

                            HStack {
                                Button("Audio Call (\(celeb.audioRatePerMin)/m)") {
                                    let res = rtcService.startCelebrityCall(
                                        caller: currentUser,
                                        celebrity: celeb,
                                        enableVideo: false
                                    )
                                    switch res {
                                    case .success:
                                        statusBanner = "Connected Celebrity Audio Call with \(celeb.displayName)"
                                    case .failure(let err):
                                        statusBanner = err.localizedDescription
                                    }
                                }
                                .buttonStyle(.bordered)

                                Button("Video Call (\(celeb.videoRatePerMin)/m)") {
                                    let res = rtcService.startCelebrityCall(
                                        caller: currentUser,
                                        celebrity: celeb,
                                        enableVideo: true
                                    )
                                    switch res {
                                    case .success:
                                        statusBanner = "Connected Celebrity Video Call with \(celeb.displayName)"
                                    case .failure(let err):
                                        statusBanner = err.localizedDescription
                                    }
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.pink)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .tabItem {
                        Label("Celebrities", systemImage: "sparkles")
                    }

                    // 3. Location Events & Ticket Booking
                    List(events) { evt in
                        VStack(alignment: .leading, spacing: 6) {
                            Text("📍 \(String(format: "%.1f", evt.distanceKm)) km away • \(evt.city)")
                                .font(.caption2.bold())
                                .foregroundStyle(.green)
                            Text(evt.title)
                                .font(.headline)
                            Text("\(evt.venueName) • \(evt.organizationName)")
                                .font(.caption)
                            Button("Book Ticket (₹\(Int(evt.ticketPrice)))") {
                                statusBanner = "Booked QR Ticket for \(evt.title)!"
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.green)
                        }
                    }
                    .tabItem {
                        Label("Events", systemImage: "map.fill")
                    }

                    // 4. Customer Care Support (Audio Call & Live Chat ONLY — No Video Call)
                    VStack(spacing: 14) {
                        Text("24/7 Customer Care Support")
                            .font(.title3.bold())
                        Text("Normal Users & Celebrities can chat or make an Audio Call to Customer Care. Video Calls are strictly disabled for Support.")
                            .font(.caption)
                            .multilineTextAlignment(.center)

                        Button {
                            _ = rtcService.startCustomerCareSupportCall(requestedVideo: false)
                            statusBanner = "Connected Audio-Only Support Call with Customer Care"
                        } label: {
                            Label("Call Customer Care (Audio Only)", systemImage: "headphones")
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.cyan)
                    }
                    .padding()
                    .tabItem {
                        Label("Support", systemImage: "headphones.circle.fill")
                    }
                }
            }
            .navigationTitle("Friends App iOS")
        }
    }
}
