import Foundation

public enum UserRole: String, CaseIterable, Codable {
    case USER = "USER"
    case CELEBRITY = "CELEBRITY"
    case ORGANIZATION = "ORGANIZATION"
    case SUPPORT = "SUPPORT"
    case SUPER_ADMIN = "SUPER_ADMIN"
}

public enum CallType: String, Codable {
    case RANDOM_AUDIO = "RANDOM_AUDIO"
    case RANDOM_VIDEO = "RANDOM_VIDEO"
    case CELEBRITY_AUDIO = "CELEBRITY_AUDIO"
    case CELEBRITY_VIDEO = "CELEBRITY_VIDEO"
    case SUPPORT_AUDIO = "SUPPORT_AUDIO"

    public var isVideoAllowed: Bool {
        switch self {
        case .RANDOM_VIDEO, .CELEBRITY_VIDEO:
            return true
        case .RANDOM_AUDIO, .CELEBRITY_AUDIO, .SUPPORT_AUDIO:
            return false
        }
    }
}

public struct UserAccount: Identifiable, Codable {
    public let id: String
    public var phone: String
    public var role: UserRole
    public var displayName: String
    public var city: String
    public var isPremium: Bool
    public var walletCoins: Int
    public var status: String

    public init(
        id: String,
        phone: String,
        role: UserRole,
        displayName: String,
        city: String,
        isPremium: Bool,
        walletCoins: Int,
        status: String = "ACTIVE"
    ) {
        self.id = id
        self.phone = phone
        self.role = role
        self.displayName = displayName
        self.city = city
        self.isPremium = isPremium
        self.walletCoins = walletCoins
        self.status = status
    }
}

public struct CelebrityItem: Identifiable, Codable {
    public let id: String
    public let displayName: String
    public let category: String
    public let bio: String
    public let audioRatePerMin: Int
    public let videoRatePerMin: Int
    public var availability: String
    public var mediaCount: Int
}

public struct NearbyEventItem: Identifiable, Codable {
    public let id: String
    public let title: String
    public let organizationName: String
    public let venueName: String
    public let city: String
    public let distanceKm: Double
    public let ticketPrice: Double
    public var remainingSeats: Int
}
