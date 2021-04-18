using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.IO;

public class linemaker : MonoBehaviour
{
    
    public int lengthOfLineRenderer = 2;
    public Material mat;
    int currentLine = -1;

    public List<List<Vector2>> lines = new List<List<Vector2>>();

    void Start()
    {
        LineRenderer lineRenderer = gameObject.AddComponent<LineRenderer>();
        lineRenderer.material = mat;
        lineRenderer.widthMultiplier = 0.2f;
        lineRenderer.positionCount = lengthOfLineRenderer;

        for (int i = 0; i < lengthOfLineRenderer; i++)
        {
            lineRenderer.SetPosition(i, new Vector3(0f, 0f, 0.0f));
        }
    }

    void Update()
    {
        if (Input.GetKeyDown("1"))
        {

        }
    }
}
