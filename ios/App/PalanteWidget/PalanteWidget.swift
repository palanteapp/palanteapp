//
//  PalanteWidget.swift
//  PalanteWidget
//

import WidgetKit
import SwiftUI

// MARK: - Shared data model

struct WidgetQuote {
    let text: String
    let author: String
}

struct WidgetGoal {
    let text: String
    let completed: Bool
}

struct PalanteWidgetData {
    static let appGroup = "group.com.move.palante.dev"

    let streak: Int
    let totalPractices: Int
    let quotes: [WidgetQuote]
    let quoteStartIndex: Int
    let goals: [WidgetGoal]

    static func load() -> PalanteWidgetData {
        let defaults = UserDefaults(suiteName: appGroup)
        let streak = defaults?.integer(forKey: "palante_streak") ?? 0
        let totalPractices = defaults?.integer(forKey: "palante_total_practices") ?? 0
        let startIndex = defaults?.integer(forKey: "palante_quote_start_index") ?? 0

        var quotes: [WidgetQuote] = []
        if let data = defaults?.data(forKey: "palante_quotes"),
           let raw = try? JSONSerialization.jsonObject(with: data) as? [[String: String]] {
            quotes = raw.compactMap { dict in
                guard let text = dict["text"], let author = dict["author"],
                      !text.isEmpty else { return nil }
                return WidgetQuote(text: text, author: author)
            }
        }
        if quotes.isEmpty {
            quotes = [WidgetQuote(text: "The struggle itself toward the heights is enough to fill a man's heart.", author: "Albert Camus")]
        }

        var goals: [WidgetGoal] = []
        if let data = defaults?.data(forKey: "palante_goals"),
           let raw = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            goals = raw.compactMap { dict in
                guard let text = dict["text"] as? String, !text.isEmpty else { return nil }
                return WidgetGoal(text: text, completed: dict["completed"] as? Bool ?? false)
            }
        }

        return PalanteWidgetData(streak: streak, totalPractices: totalPractices, quotes: quotes, quoteStartIndex: startIndex, goals: goals)
    }
}

// MARK: - Timeline entry

struct PalanteEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let totalPractices: Int
    let quote: WidgetQuote
    let goals: [WidgetGoal]
}

// MARK: - Timeline provider — one entry per hour, cycling through quotes

struct PalanteProvider: TimelineProvider {
    func placeholder(in context: Context) -> PalanteEntry {
        PalanteEntry(date: .now, streak: 7, totalPractices: 7,
                     quote: WidgetQuote(text: "Keep going.", author: "Palante"),
                     goals: [WidgetGoal(text: "Build healthy habits", completed: false)])
    }

    func getSnapshot(in context: Context, completion: @escaping (PalanteEntry) -> Void) {
        let data = PalanteWidgetData.load()
        completion(PalanteEntry(date: .now, streak: data.streak, totalPractices: data.totalPractices,
                                quote: data.quotes[data.quoteStartIndex % data.quotes.count],
                                goals: data.goals))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PalanteEntry>) -> Void) {
        let data = PalanteWidgetData.load()
        let quotes = data.quotes
        let now = Date()
        var entries: [PalanteEntry] = []

        for i in 0..<quotes.count {
            let quoteIndex = (data.quoteStartIndex + i) % quotes.count
            let entryDate = now.addingTimeInterval(Double(i) * 3600)
            entries.append(PalanteEntry(date: entryDate, streak: data.streak, totalPractices: data.totalPractices,
                                        quote: quotes[quoteIndex],
                                        goals: data.goals))
        }

        let refreshDate = now.addingTimeInterval(Double(quotes.count) * 3600)
        completion(Timeline(entries: entries, policy: .after(refreshDate)))
    }
}

// MARK: - Colors

extension Color {
    static let terracotta = Color(red: 201/255, green: 106/255, blue: 58/255)
    static let parchment  = Color(red: 245/255, green: 238/255, blue: 224/255)
    static let paleGold   = Color(red: 229/255, green: 214/255, blue: 167/255)
    static let oliveDeep  = Color(red: 65/255,  green: 93/255,  blue: 67/255)
}

// MARK: - Small widget: quote only

struct SmallWidgetView: View {
    let entry: PalanteEntry

    var body: some View {
        VStack(alignment: .center, spacing: 4) {
            Text("PALANTE")
                .font(.system(size: 7, weight: .semibold, design: .serif))
                .tracking(2)
                .foregroundColor(.parchment.opacity(0.6))

            Spacer(minLength: 4)

            Text(entry.quote.text)
                .font(.system(size: 12, weight: .regular, design: .serif))
                .foregroundColor(.parchment)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.65)
                .lineLimit(nil)
                .fixedSize(horizontal: false, vertical: false)

            Spacer(minLength: 4)

            Text("— \(entry.quote.author)")
                .font(.system(size: 8, weight: .regular, design: .serif))
                .foregroundColor(.parchment.opacity(0.55))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }
}

// MARK: - Medium widget: quote left, goals right

struct MediumWidgetView: View {
    let entry: PalanteEntry

    var body: some View {
        HStack(spacing: 0) {
            // Quote column
            VStack(alignment: .leading, spacing: 6) {
                Text("PALANTE")
                    .font(.system(size: 7, weight: .semibold, design: .serif))
                    .tracking(2)
                    .foregroundColor(.parchment.opacity(0.6))

                Spacer()

                Text(entry.quote.text)
                    .font(.system(size: 11, weight: .regular, design: .serif))
                    .foregroundColor(.parchment)
                    .lineLimit(5)
                    .minimumScaleFactor(0.8)
                    .fixedSize(horizontal: false, vertical: false)

                Spacer()

                Text("— \(entry.quote.author)")
                    .font(.system(size: 8, weight: .regular, design: .serif))
                    .foregroundColor(.parchment.opacity(0.5))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.leading, 14)
            .padding(.trailing, 16)
            .padding(.vertical, 12)

            // Divider
            Rectangle()
                .fill(Color.parchment.opacity(0.12))
                .frame(width: 1)
                .padding(.vertical, 6)

            // Right column: mandala ring + goals
            VStack(alignment: .center, spacing: 6) {
                // Mandala progress arc (90-day cycle)
                ZStack {
                    Circle()
                        .stroke(Color.parchment.opacity(0.1), lineWidth: 3)
                        .frame(width: 42, height: 42)
                    Circle()
                        .trim(from: 0, to: min(CGFloat(entry.totalPractices) / 90.0, 1.0))
                        .stroke(Color.terracotta, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                        .frame(width: 42, height: 42)
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text("\(min(entry.totalPractices, 90))")
                            .font(.system(size: 10, weight: .bold, design: .default))
                            .foregroundColor(.parchment)
                        Text("/ 90")
                            .font(.system(size: 7, weight: .medium, design: .default))
                            .foregroundColor(.parchment.opacity(0.45))
                    }
                }
                .padding(.top, 4)

                Spacer()

                // Goals list
                VStack(alignment: .leading, spacing: 5) {
                    if entry.goals.isEmpty {
                        Text("Set goals in app")
                            .font(.system(size: 9, design: .serif))
                            .foregroundColor(.parchment.opacity(0.35))
                            .italic()
                    } else {
                        ForEach(Array(entry.goals.prefix(3).enumerated()), id: \.offset) { _, goal in
                            HStack(alignment: .top, spacing: 5) {
                                Circle()
                                    .fill(goal.completed ? Color.paleGold : Color.parchment.opacity(0.2))
                                    .frame(width: 5, height: 5)
                                    .padding(.top, 2.5)
                                Text(goal.text)
                                    .font(.system(size: 9, weight: .medium, design: .default))
                                    .foregroundColor(goal.completed ? .parchment.opacity(0.35) : .parchment.opacity(0.80))
                                    .lineLimit(1)
                                    .strikethrough(goal.completed, color: .parchment.opacity(0.3))
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Spacer()
            }
            .frame(width: 110, alignment: .center)
            .padding(.leading, 10)
            .padding(.vertical, 12)
            .padding(.trailing, 10)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Entry view router

struct PalanteWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: PalanteEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget definition

struct PalanteWidget: Widget {
    let kind: String = "PalanteWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PalanteProvider()) { entry in
            if #available(iOS 17.0, *) {
                PalanteWidgetEntryView(entry: entry)
                    .containerBackground(Color.oliveDeep, for: .widget)
                    .widgetURL(URL(string: "palante://open"))
            } else {
                PalanteWidgetEntryView(entry: entry)
                    .background(Color.oliveDeep)
                    .widgetURL(URL(string: "palante://open"))
            }
        }
        .configurationDisplayName("Palante")
        .description("Daily wisdom and your goals.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemMedium) {
    PalanteWidget()
} timeline: {
    PalanteEntry(date: .now, streak: 7, totalPractices: 7,
                 quote: WidgetQuote(text: "The struggle itself toward the heights is enough to fill a man's heart.", author: "Albert Camus"),
                 goals: [
                    WidgetGoal(text: "Morning practice", completed: true),
                    WidgetGoal(text: "Read 20 pages", completed: false),
                    WidgetGoal(text: "10 min meditation", completed: false),
                 ])
}
