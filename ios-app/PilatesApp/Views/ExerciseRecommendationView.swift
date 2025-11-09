//
//  ExerciseRecommendationView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct ExerciseRecommendationView: View {
    let problem: MuscleProblem
    @Environment(\.managedObjectContext) private var viewContext
    @State private var selectedEquipment: String? = nil
    @State private var favoriteExercises: Set<NSManagedObjectID> = []
    
    private var recommendations: [ExerciseRecommendation] {
        guard let recs = problem.recommendations as? Set<ExerciseRecommendation> else { return [] }
        return Array(recs).sorted { $0.priority < $1.priority }
    }
    
    private var equipmentTypes: [String] {
        let equipment = Set(recommendations.compactMap { $0.exercise?.equipment?.name })
        return Array(equipment).sorted()
    }
    
    private var filteredRecommendations: [ExerciseRecommendation] {
        let filtered = recommendations
        
        if let equipment = selectedEquipment {
            return filtered.filter { $0.exercise?.equipment?.name == equipment }
        }
        
        return filtered
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // 문제 정보
                VStack(alignment: .leading, spacing: 12) {
                    Text(problem.name ?? "알 수 없음")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    if let category = problem.category {
                        Text(category)
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                    
                    if let description = problem.description {
                        Text(description)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                    }
                }
                .padding(.horizontal)
                
                // 장비 필터
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        EquipmentChip(title: "전체", isSelected: selectedEquipment == nil) {
                            selectedEquipment = nil
                        }
                        
                        ForEach(equipmentTypes, id: \.self) { equipment in
                            EquipmentChip(title: equipment, isSelected: selectedEquipment == equipment) {
                                selectedEquipment = equipment
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // 운동 추천 목록
                LazyVStack(spacing: 16) {
                    ForEach(filteredRecommendations, id: \.objectID) { recommendation in
                        if let exercise = recommendation.exercise {
                            ExerciseCard(
                                exercise: exercise,
                                isFavorite: favoriteExercises.contains(exercise.objectID),
                                onFavoriteToggle: {
                                    toggleFavorite(exercise)
                                }
                            )
                        }
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .navigationTitle("운동 추천")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadFavorites()
        }
    }
    
    private func loadFavorites() {
        // UserDefaults에서 즐겨찾기 로드
        if let data = UserDefaults.standard.data(forKey: "favoriteExercises"),
           let ids = try? JSONDecoder().decode([String].self, from: data) {
            // ID를 ObjectID로 변환하는 로직 추가 필요
        }
    }
    
    private func toggleFavorite(_ exercise: Exercise) {
        if favoriteExercises.contains(exercise.objectID) {
            favoriteExercises.remove(exercise.objectID)
        } else {
            favoriteExercises.insert(exercise.objectID)
        }
        
        // UserDefaults에 저장
        let ids = favoriteExercises.map { $0.uriRepresentation().absoluteString }
        if let data = try? JSONEncoder().encode(ids) {
            UserDefaults.standard.set(data, forKey: "favoriteExercises")
        }
    }
}

struct EquipmentChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: equipmentIcon(title))
                    .font(.caption)
                
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.purple : Color(.systemGray5))
            .cornerRadius(20)
        }
    }
    
    private func equipmentIcon(_ name: String) -> String {
        switch name {
        case "매트": return "square.fill"
        case "리포머": return "rectangle.fill"
        case "캐딜락": return "bed.double.fill"
        case "체어": return "chair.fill"
        case "바렐": return "cylinder.fill"
        default: return "circle.fill"
        }
    }
}

struct ExerciseCard: View {
    let exercise: Exercise
    let isFavorite: Bool
    let onFavoriteToggle: () -> Void
    @State private var showDetail = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(exercise.name ?? "알 수 없음")
                        .font(.headline)
                    
                    if let equipment = exercise.equipment?.name {
                        Text(equipment)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Button(action: onFavoriteToggle) {
                    Image(systemName: isFavorite ? "star.fill" : "star")
                        .foregroundColor(isFavorite ? .yellow : .gray)
                        .font(.title3)
                }
            }
            
            if let instructions = exercise.instructions {
                Text(instructions)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
            
            if let difficulty = exercise.difficulty {
                HStack {
                    Text("난이도:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(difficulty)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(difficultyColor(difficulty))
                }
            }
            
            Button(action: { showDetail = true }) {
                Text("자세히 보기")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.purple)
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        .sheet(isPresented: $showDetail) {
            ExerciseDetailView(exercise: exercise)
        }
    }
    
    private func difficultyColor(_ difficulty: String) -> Color {
        switch difficulty {
        case "초급": return .green
        case "중급": return .orange
        case "고급": return .red
        default: return .gray
        }
    }
}













