// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "FriendsAppiOS",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "FriendsApp",
            targets: ["FriendsApp"]
        )
    ],
    targets: [
        .target(
            name: "FriendsApp",
            path: "Sources/FriendsApp"
        )
    ]
)
