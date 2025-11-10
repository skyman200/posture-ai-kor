//
//  MuscleProblemListView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct MuscleProblemListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \MuscleProblem.category, ascending: true)],
        animation: .default)
    private var problems: FetchedResults<MuscleProblem>
    
    @State private var searchText = ""
    @State private var selectedCategory: String? = nil
    
    private var categories: [String] {
        Array(Set(problems.map { $0.category ?? "" })).sorted()
    }
    
    private var filteredProblems: [MuscleProblem] {
        var filtered = Array(problems)
        
        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }
        
        if !searchText.isEmpty {
            filtered = filtered.filter {
                ($0.name?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                ($0.description?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
        
        return filtered
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // 카테고리 필터
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        CategoryChip(title: "전체", isSelected: selectedCategory == nil) {
                            selectedCategory = nil
                        }
                        
                        ForEach(categories, id: \.self) { category in
                            CategoryChip(title: category, isSelected: selectedCategory == category) {
                                selectedCategory = category
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 12)
                }
                .background(Color(.systemGray6))
                
                // 검색 바
                SearchBar(text: $searchText)
                    .padding(.horizontal)
                
                // 문제 목록
                List {
                    ForEach(filteredProblems, id: \.objectID) { problem in
                        NavigationLink(destination: ExerciseRecommendationView(problem: problem)) {
                            MuscleProblemRow(problem: problem)
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
            .navigationTitle("근육 문제")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

struct CategoryChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.purple : Color(.systemGray5))
                .cornerRadius(20)
        }
    }
}

struct MuscleProblemRow: View {
    let problem: MuscleProblem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(problem.name ?? "알 수 없음")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                if let category = problem.category {
                    Text(category)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(categoryColor(category))
                        .cornerRadius(8)
                }
            }
            
            if let description = problem.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            if let recommendations = problem.recommendations as? Set<ExerciseRecommendation> {
                Text("\(recommendations.count)개의 운동 추천")
                    .font(.caption)
                    .foregroundColor(.purple)
            }
        }
        .padding(.vertical, 4)
    }
    
    private func categoryColor(_ category: String) -> Color {
        switch category {
        case "목":
            return .blue
        case "상체":
            return .green
        case "코어":
            return .orange
        case "등":
            return .red
        case "골반":
            return .purple
        case "하지":
            return .pink
        default:
            return .gray
        }
    }
}

struct SearchBar: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("검색...", text: $text)
                .textFieldStyle(.plain)
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}















