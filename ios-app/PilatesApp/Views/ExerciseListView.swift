//
//  ExerciseListView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct ExerciseListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Exercise.name, ascending: true)],
        animation: .default)
    private var exercises: FetchedResults<Exercise>
    
    @State private var searchText = ""
    @State private var selectedEquipment: String? = nil
    @State private var selectedDifficulty: String? = nil
    @State private var availableEquipment: Set<String> = []
    
    private var equipmentTypes: [String] {
        Array(Set(exercises.compactMap { $0.equipment?.name })).sorted()
    }
    
    private var difficultyLevels: [String] {
        Array(Set(exercises.compactMap { $0.difficulty })).sorted()
    }
    
    private var filteredExercises: [Exercise] {
        var filtered = Array(exercises)
        
        if let equipment = selectedEquipment {
            filtered = filtered.filter { $0.equipment?.name == equipment }
        }
        
        if let difficulty = selectedDifficulty {
            filtered = filtered.filter { $0.difficulty == difficulty }
        }
        
        // 사용 가능한 장비만 표시
        if !availableEquipment.isEmpty {
            filtered = filtered.filter {
                guard let equipmentName = $0.equipment?.name else { return false }
                return availableEquipment.contains(equipmentName)
            }
        }
        
        if !searchText.isEmpty {
            filtered = filtered.filter {
                ($0.name?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                ($0.instructions?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
        
        return filtered
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // 검색 바
                SearchBar(text: $searchText)
                    .padding(.horizontal)
                    .padding(.top, 8)
                
                // 필터
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        FilterChip(title: "전체 장비", isSelected: selectedEquipment == nil) {
                            selectedEquipment = nil
                        }
                        
                        ForEach(equipmentTypes, id: \.self) { equipment in
                            FilterChip(
                                title: equipment,
                                isSelected: selectedEquipment == equipment,
                                isAvailable: availableEquipment.isEmpty || availableEquipment.contains(equipment)
                            ) {
                                selectedEquipment = equipment
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 12)
                }
                .background(Color(.systemGray6))
                
                // 난이도 필터
                if !difficultyLevels.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            FilterChip(title: "전체 난이도", isSelected: selectedDifficulty == nil) {
                                selectedDifficulty = nil
                            }
                            
                            ForEach(difficultyLevels, id: \.self) { difficulty in
                                FilterChip(title: difficulty, isSelected: selectedDifficulty == difficulty) {
                                    selectedDifficulty = difficulty
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                    }
                    .background(Color(.systemGray6))
                }
                
                // 운동 목록
                List {
                    ForEach(filteredExercises, id: \.objectID) { exercise in
                        NavigationLink(destination: ExerciseDetailView(exercise: exercise)) {
                            ExerciseRow(exercise: exercise)
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
            .navigationTitle("전체 운동")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: EquipmentAvailabilityView(availableEquipment: $availableEquipment)) {
                        Image(systemName: "slider.horizontal.3")
                    }
                }
            }
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    var isAvailable: Bool = true
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : (isAvailable ? .primary : .secondary))
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.purple : (isAvailable ? Color(.systemGray5) : Color(.systemGray4)))
                .cornerRadius(20)
                .opacity(isAvailable ? 1.0 : 0.6)
        }
        .disabled(!isAvailable)
    }
}

struct ExerciseRow: View {
    let exercise: Exercise
    
    var body: some View {
        HStack(spacing: 12) {
            // 장비 아이콘
            if let equipmentName = exercise.equipment?.name {
                Image(systemName: equipmentIcon(equipmentName))
                    .font(.title2)
                    .foregroundColor(.purple)
                    .frame(width: 40)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(exercise.name ?? "알 수 없음")
                    .font(.headline)
                
                if let equipment = exercise.equipment?.name {
                    Text(equipment)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let difficulty = exercise.difficulty {
                    Text(difficulty)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(difficultyColor(difficulty))
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
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
    
    private func difficultyColor(_ difficulty: String) -> Color {
        switch difficulty {
        case "초급": return .green
        case "중급": return .orange
        case "고급": return .red
        default: return .gray
        }
    }
}










