//
//  CVAIntegrationView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct CVAIntegrationView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var cvaValue: String = ""
    @State private var pelvicValue: String = ""
    @State private var kneeValue: String = ""
    @State private var showingRecommendations = false
    @State private var recommendations: [ExerciseRecommendation] = []
    
    var body: some View {
        NavigationView {
            Form {
                Section("CVA 측정값 입력") {
                    TextField("CVA (예: 48.5)", text: $cvaValue)
                        .keyboardType(.decimalPad)
                    
                    TextField("TRUNK (예: -4.8)", text: $pelvicValue)
                        .keyboardType(.decimalPad)
                    
                    TextField("KNEE (예: 173.0)", text: $kneeValue)
                        .keyboardType(.decimalPad)
                }
                
                Section {
                    Button(action: analyzeAndRecommend) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                            Text("분석 및 추천")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .disabled(!isValidInput)
                }
                
                if !recommendations.isEmpty {
                    Section("추천된 운동") {
                        Text("\(recommendations.count)개의 운동이 추천되었습니다")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        NavigationLink(destination: ExerciseRecommendationListView(recommendations: recommendations)) {
                            Text("추천 운동 보기")
                        }
                    }
                }
            }
            .navigationTitle("CVA 연동")
            .navigationBarTitleDisplayMode(.large)
        }
    }
    
    private var isValidInput: Bool {
        !cvaValue.isEmpty || !pelvicValue.isEmpty || !kneeValue.isEmpty
    }
    
    private func analyzeAndRecommend() {
        let cva = Double(cvaValue)
        let pelvic = Double(pelvicValue)
        let knee = Double(kneeValue)
        
        let problems = CVAIntegrationService.mapCVAResultToMuscleProblems(
            cva: cva,
            pelvic: pelvic,
            knee: knee
        )
        
        recommendations = CVAIntegrationService.getRecommendationsForProblems(
            problems: problems,
            context: viewContext
        )
    }
}

struct ExerciseRecommendationListView: View {
    let recommendations: [ExerciseRecommendation]
    @State private var selectedEquipment: String? = nil
    
    private var equipmentTypes: [String] {
        let equipment = Set(recommendations.compactMap { $0.exercise?.equipment?.name })
        return Array(equipment).sorted()
    }
    
    private var filteredRecommendations: [ExerciseRecommendation] {
        if let equipment = selectedEquipment {
            return recommendations.filter { $0.exercise?.equipment?.name == equipment }
        }
        return recommendations
    }
    
    var body: some View {
        VStack(spacing: 0) {
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
                .padding()
            }
            .background(Color(.systemGray6))
            
            // 추천 목록
            List {
                ForEach(filteredRecommendations, id: \.objectID) { recommendation in
                    if let exercise = recommendation.exercise {
                        NavigationLink(destination: ExerciseDetailView(exercise: exercise)) {
                            ExerciseCard(exercise: exercise, isFavorite: false, onFavoriteToggle: {})
                        }
                    }
                }
            }
        }
        .navigationTitle("추천 운동")
        .navigationBarTitleDisplayMode(.inline)
    }
}
















