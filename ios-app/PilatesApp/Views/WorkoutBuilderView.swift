//
//  WorkoutBuilderView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct WorkoutBuilderView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var workoutPrograms: [WorkoutProgram] = []
    @State private var showingNewProgram = false
    
    var body: some View {
        NavigationView {
            Group {
                if workoutPrograms.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("운동 프로그램이 없습니다")
                            .font(.title3)
                            .foregroundColor(.secondary)
                        
                        Button(action: { showingNewProgram = true }) {
                            Label("새 프로그램 만들기", systemImage: "plus.circle.fill")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .background(Color.purple)
                                .cornerRadius(12)
                        }
                    }
                } else {
                    List {
                        ForEach(workoutPrograms) { program in
                            NavigationLink(destination: WorkoutProgramDetailView(program: program)) {
                                WorkoutProgramRow(program: program)
                            }
                        }
                        .onDelete(perform: deletePrograms)
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("운동 프로그램")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingNewProgram = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingNewProgram) {
                NewWorkoutProgramView(programs: $workoutPrograms)
            }
            .onAppear {
                loadPrograms()
            }
        }
    }
    
    private func loadPrograms() {
        if let data = UserDefaults.standard.data(forKey: "workoutPrograms"),
           let programs = try? JSONDecoder().decode([WorkoutProgram].self, from: data) {
            workoutPrograms = programs
        }
    }
    
    private func deletePrograms(at offsets: IndexSet) {
        workoutPrograms.remove(atOffsets: offsets)
        savePrograms()
    }
    
    private func savePrograms() {
        if let data = try? JSONEncoder().encode(workoutPrograms) {
            UserDefaults.standard.set(data, forKey: "workoutPrograms")
        }
    }
}

struct WorkoutProgram: Identifiable, Codable {
    let id: UUID
    var name: String
    var description: String
    var exercises: [ExerciseItem]
    var createdAt: Date
    
    init(id: UUID = UUID(), name: String, description: String = "", exercises: [ExerciseItem] = [], createdAt: Date = Date()) {
        self.id = id
        self.name = name
        self.description = description
        self.exercises = exercises
        self.createdAt = createdAt
    }
}

struct ExerciseItem: Codable {
    var exerciseId: String
    var exerciseName: String
    var sets: Int
    var reps: Int
    var notes: String
}

struct WorkoutProgramRow: View {
    let program: WorkoutProgram
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(program.name)
                .font(.headline)
            
            if !program.description.isEmpty {
                Text(program.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            HStack {
                Label("\(program.exercises.count)개 운동", systemImage: "figure.walk")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(program.createdAt, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}









