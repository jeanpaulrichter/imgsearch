cmake_minimum_required(VERSION 3.10)
project(imgsearch VERSION 1.0)

set(BUILD_SHARED_LIBS OFF)

if ("${CMAKE_BINARY_DIR}" STREQUAL "${CMAKE_SOURCE_DIR}")
    message(FATAL_ERROR "In-source builds are not permitted!")
endif ()

set(SRC_FILES
    "${CMAKE_CURRENT_SOURCE_DIR}/src/main.cpp"
)

if(WIN32)
    enable_language(RC)
    list(APPEND SRC_FILES "${CMAKE_CURRENT_SOURCE_DIR}/msvs/icon.rc")
    add_definitions(-DUNICODE -D_UNICODE -DWINDOWS -NDEBUG)
endif()

add_executable(${PROJECT_NAME} ${SRC_FILES})

target_include_directories(${PROJECT_NAME}
    PUBLIC
        ${CMAKE_CURRENT_BINARY_DIR}
    PRIVATE
        ${SOURCE_DIR}
	"${CMAKE_CURRENT_SOURCE_DIR}/libs/webview2/include"
)

if(WIN32)
	target_link_libraries(${PROJECT_NAME} "${CMAKE_CURRENT_SOURCE_DIR}/libs/webview2/lib/WebView2LoaderStatic.lib" advapi32.lib)
	target_link_options(${PROJECT_NAME} PRIVATE "/SUBSYSTEM:WINDOWS")
endif()

install(TARGETS ${PROJECT_NAME}
        CONFIGURATIONS Release
        RUNTIME DESTINATION "${CMAKE_CURRENT_SOURCE_DIR}/../bin")