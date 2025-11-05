//
//  ContentView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            MuscleProblemListView()
                .tabItem {
                    Label("근육 문제", systemImage: "figure.arms.open")
                }
                .tag(0)
            
            ExerciseListView()
                .tabItem {
                    Label("운동 추천", systemImage: "list.bullet")
                }
                .tag(1)
            
            CVAIntegrationView()
                .tabItem {
                    Label("CVA 연동", systemImage: "chart.line.uptrend.xyaxis")
                }
                .tag(2)
            
            FavoritesView()
                .tabItem {
                    Label("즐겨찾기", systemImage: "star.fill")
                }
                .tag(3)
            
            WorkoutBuilderView()
                .tabItem {
                    Label("운동 프로그램", systemImage: "calendar")
                }
                .tag(4)
            
            SettingsView()
                .tabItem {
                    Label("설정", systemImage: "gearshape.fill")
                }
                .tag(5)
        }
        .accentColor(.purple)
    }
}