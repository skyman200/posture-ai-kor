//
//  ExerciseDetailView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct ExerciseDetailView: View {
    let exercise: Exercise
    @Environment(\.dismiss) private var dismiss
    @State private var notes: String = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // 운동 이름
                    Text(exercise.name ?? "알 수 없음")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    // 장비 정보
                    if let equipment = exercise.equipment {
                        HStack {
                            Image(systemName: equipmentIcon(equipment.name ?? ""))
                                .font(.title2)
                                .foregroundColor(.purple)
                            
                            Text(equipment.name ?? "")
                                .font(.title3)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // 난이도
                    if let difficulty = exercise.difficulty {
                        HStack {
                            Text("난이도:")
                                .font(.headline)
                            Text(difficulty)
                                .font(.headline)
                                .foregroundColor(difficultyColor(difficulty))
                        }
                    }
                    
                    Divider()
                    
                    // 운동 설명
                    if let instructions = exercise.instructions {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("운동 방법")
                                .font(.headline)
                            
                            Text(instructions)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    
                    // 전문가 노트
                    VStack(alignment: .leading, spacing: 8) {
                        Text("전문가 노트")
                            .font(.headline)
                        
                        TextEditor(text: $notes)
                            .frame(height: 150)
                            .padding(8)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color(.systemGray4), lineWidth: 1)
                            )
                    }
                }
                .padding()
            }
            .navigationTitle("운동 상세")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("완료") {
                        saveNotes()
                        dismiss()
                    }
                }
            }
            .onAppear {
                loadNotes()
            }
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
    
    private func difficultyColor(_ difficulty: String) -> Color {
        switch difficulty {
        case "초급": return .green
        case "중급": return .orange
        case "고급": return .red
        default: return .gray
        }
    }
    
    private func loadNotes() {
        if let exerciseId = exercise.objectID.uriRepresentation().absoluteString {
            notes = UserDefaults.standard.string(forKey: "exercise_notes_\(exerciseId)") ?? ""
        }
    }
    
    private func saveNotes() {
        if let exerciseId = exercise.objectID.uriRepresentation().absoluteString {
            UserDefaults.standard.set(notes, forKey: "exercise_notes_\(exerciseId)")
        }
    }
}









