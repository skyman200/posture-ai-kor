//
//  WorkoutProgramDetailView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct WorkoutProgramDetailView: View {
    let program: WorkoutProgram
    @Environment(\.managedObjectContext) private var viewContext
    @State private var exercises: [Exercise] = []
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // 프로그램 정보
                VStack(alignment: .leading, spacing: 12) {
                    Text(program.name)
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    if !program.description.isEmpty {
                        Text(program.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Label("\(program.exercises.count)개 운동", systemImage: "figure.walk")
                        Spacer()
                        Text(program.createdAt, style: .date)
                            .foregroundColor(.secondary)
                    }
                    .font(.subheadline)
                }
                .padding()
                
                Divider()
                
                // 운동 목록
                VStack(alignment: .leading, spacing: 16) {
                    Text("운동 목록")
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                    
                    ForEach(Array(program.exercises.enumerated()), id: \.offset) { index, item in
                        if let exercise = exercises.first(where: { $0.objectID.uriRepresentation().absoluteString == item.exerciseId }) {
                            NavigationLink(destination: ExerciseDetailView(exercise: exercise)) {
                                WorkoutExerciseCard(item: item, index: index + 1)
                            }
                        } else {
                            WorkoutExerciseCard(item: item, index: index + 1)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .navigationTitle("프로그램 상세")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadExercises()
        }
    }
    
    private func loadExercises() {
        let request = NSFetchRequest<Exercise>(entityName: "Exercise")
        exercises = (try? viewContext.fetch(request)) ?? []
    }
}

struct WorkoutExerciseCard: View {
    let item: ExerciseItem
    let index: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("\(index).")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.purple)
                
                Text(item.exerciseName)
                    .font(.headline)
                
                Spacer()
            }
            
            HStack {
                Label("\(item.sets)세트", systemImage: "repeat")
                Label("\(item.reps)회", systemImage: "number")
            }
            .font(.subheadline)
            .foregroundColor(.secondary)
            
            if !item.notes.isEmpty {
                Text(item.notes)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}











